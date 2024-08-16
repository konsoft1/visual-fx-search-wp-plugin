import { UnrealBloomPass } from './three@0.123.0/examples/jsm/postprocessing/UnrealBloomPass1.js';
import * as THREE from './three@0.123.0/build/three.module.js';
import { EffectComposer } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/RenderPass.js';
import * as d3 from '//cdn.skypack.dev/d3@6';

const graphElement = document.getElementById("fx-layer");

if (graphElement) {
    const deg2rad = deg => deg * Math.PI / 180;

    const initialData = { nodes: [{ id: 0 }], links: [] };

    function lcg(seed) {
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        let state = seed;
        return () => {
            state = (a * state + c) % m;
            return state / m;
        };
    }

    const N = 30;
    
    const radius = 100;

    const graph = ForceGraph3D()(document.getElementById("fx-layer"))
        .enableNavigationControls(false)
        .showNavInfo(false)
        .nodeRelSize(4)
        .nodeOpacity(1)
        .linkWidth(5)
        .linkDirectionalParticles(5)
        .linkDirectionalParticleWidth(5)
        .backgroundColor('rgba(0,0,0,0)');
        
    const distance = 1600 / (2 * Math.atan((graph.camera().fov / 2) * (Math.PI / 180)));

    graph
        .d3Force('center', null);

    const renderer = graph.renderer();
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = Math.pow(2, 4.0);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(graph.scene(), graph.camera());
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 3, 1, 0);
    composer.addPass(bloomPass);

    let currentAngle = 0;
    const animate = () => {
        requestAnimationFrame(animate);

        graph.cameraPosition({
            x: distance * Math.sin(deg2rad(currentAngle)),
            z: distance * Math.cos(deg2rad(currentAngle))
        }, {
            x: radius * 3 * Math.sin(deg2rad(currentAngle + 90)),
            z: radius * 3 * Math.cos(deg2rad(currentAngle + 90))
        });

        currentAngle += 0.5;

        composer.render();
    };

    animate();

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        graph.width(width);
        graph.height(height);
        graph.refresh();

        renderer.setSize(width, height);

        composer.setSize(width, height);
    });

    function forceRadial3D(radius, centerX, centerY, centerZ, strengthCallback) {
        let nodes;

        function force(alpha) {
            for (let i = 0, n = nodes.length; i < n; ++i) {
                const node = nodes[i];
                const dx = node.x - centerX;
                const dy = node.y - centerY;
                const dz = node.z - centerZ;
                const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

                // Use the strength callback to determine the force strength for this node
                const strength = strengthCallback(node);

                const k = (radius - r) * alpha * strength;

                if (r !== 0) {
                    node.vx += dx * k / r;
                    node.vy += dy * k / r;
                    node.vz += dz * k / r;
                }
            }
        }

        force.initialize = function (_) {
            nodes = _;
        };

        return force;
    }

    /* function customManyBodyForce() {
        const force = d3.forceManyBody();
        const originalForce = force.initialize;

        force.initialize = function (nodes) {
            originalForce.call(this, nodes);
            this.nodes = nodes;
        };

        force.force = function (alpha) {
            const nodes = this.nodes;
            for (let i = 0; i < nodes.length; ++i) {
                for (let j = i + 1; j < nodes.length; ++j) {
                    if (nodes[i].group === nodes[j].group) {
                        const dx = nodes[j].x - nodes[i].x;
                        const dy = nodes[j].y - nodes[i].y;
                        const dz = nodes[j].z - nodes[i].z;
                        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        const strength = force.strength() * alpha / distance;
                        nodes[i].vx -= dx * strength;
                        nodes[i].vy -= dy * strength;
                        nodes[i].vz -= dz * strength;
                        nodes[j].vx += dx * strength;
                        nodes[j].vy += dy * strength;
                        nodes[j].vz += dz * strength;
                    }
                }
            }
        };

        return force;
    }

    function groupSeparationForce(alpha) {
        const nodes = graph.graphData().nodes;
        const links = graph.graphData().links;

        for (let i = 0; i < nodes.length; ++i) {
            for (let j = i + 1; j < nodes.length; ++j) {
                if (nodes[i].group === nodes[j].group) {
                    const dx = nodes[j].x - nodes[i].x;
                    const dy = nodes[j].y - nodes[i].y;
                    const dz = nodes[j].z - nodes[i].z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    const strength = (distance - 50) * alpha / distance;
                    nodes[i].vx -= dx * strength;
                    nodes[i].vy -= dy * strength;
                    nodes[i].vz -= dz * strength;
                    nodes[j].vx += dx * strength;
                    nodes[j].vy += dy * strength;
                    nodes[j].vz += dz * strength;
                }
            }
        }
    } */

    function redraw() {
        const colors = ['#3ff', '#ff3', '#f3f', '#f33', '#33f'];

        const graphData = (seeds) => {
            const sds = seeds.split(' ');
            let nodes = [];
            const links = [];

            const interval = radius * 3;//graphElement.clientHeight / (sds.length + 1);

            for (let idx = 0; idx < sds.length; idx++) {
                let random = lcg(Math.round(sds[idx] * 100) + idx);
                const centerY = idx * interval - (sds.length - 1) * interval / 2; // Center position for each group on the y-axis
                const newnodes = [...Array(N).keys()].map(i => {
                    const node = {
                        id: i + idx * N,
                        val: (random() * 1.5) + 1,
                        color: colors[idx],
                        group: idx + 1
                    };
                    if (i === 0) {
                        // Fix the central node for the group
                        node.x = 0;
                        node.y = centerY;
                        node.z = 0;
                    } else {
                        // Place other nodes randomly around the central node
                        node.x = (random() - 0.5) * radius * 2; // Spread nodes on the x-axis
                        node.y = centerY + (random() - 0.5) * radius * 2; // Spread nodes on the y-axis
                        node.z = (random() - 0.5) * radius * 2; // Spread nodes on the z-axis
                    }
                    return node;
                });
                nodes = nodes.concat(newnodes);

                newnodes.forEach(node => {
                    const numNodeLinks = Math.round(random() * (0.75 + random())) + 1;
                    for (let i = 0; i < numNodeLinks; i++) {
                        let target = Math.round(random() * (node.id > idx * N ? node.id - idx * N - 1 : node.id - idx * N)) + idx * N;
                        if (node.id != target && links.filter(link => link.source == node.id && link.target == target).length == 0)
                            links.push({
                                source: node.id,
                                target: target,
                                length: 50
                            });
                    }
                });


                graph.d3Force('radial' + (idx + 1), forceRadial3D(0, 0, centerY, 0, d => d.group === idx + 1 ? 0.1 : 0));

                const sphereGeometry1 = new THREE.SphereGeometry(radius, 8, 8);
                const sphereMaterial1 = new THREE.MeshBasicMaterial({
                    color: 0x0202ff,
                    wireframe: true,
                    opacity: 0.15,
                    transparent: true
                });
                const sphere = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
                sphere.position.set(0, centerY, 0);
                graph.scene().add(sphere);
            }

            return { nodes, links };
        };

        const gData = graphData(document.getElementById('fx-layer').getAttribute('data-seed'));
        const links = gData.links;
        graph.graphData(gData)
            .nodeAutoColorBy(null)
            .nodeColor(node => node.color);

        graph.d3Force('link')
            .id(d => d.id)
            .distance(link => link.length);

        graph.d3Force('charge')
            .distanceMax(200);

        //graph.d3Force('charge', customManyBodyForce());
        //graph.d3Force('customGroupSeparation', (alpha) => groupSeparationForce(alpha));

    }

    redraw();
}
