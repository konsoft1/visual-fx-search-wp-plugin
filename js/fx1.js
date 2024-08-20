import { UnrealBloomPass } from './three@0.123.0/examples/jsm/postprocessing/UnrealBloomPass1.js';
import * as THREE from './three@0.123.0/build/three.module.js';
import { EffectComposer } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/RenderPass.js';

const graphElement = document.getElementById("fx-layer");

if (graphElement) {

    document.body.style.overflow = 'hidden';
    // Graph values
    const N = 30;
    const radius = 100;
    const forceMaxD = 100;

    // Camera values
    let distance = 1000;//1600 / (2 * Math.atan((graph.camera().fov / 2) * (Math.PI / 180)));
    let ratio = 1;

    // Metric values
    let vh_u = 0;
    let firstCenterY_u = 0;
    let postGap_u = 0;
    let postW_u = 0;
    let paddingX_u = 0;

    // Helpers
    const deg2rad = deg => deg * Math.PI / 180;
    //const initialData = { nodes: [{ id: 0 }], links: [] };

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

    // Graph init
    const graph = ForceGraph3D()(document.getElementById("fx-layer"))
        .enableNavigationControls(false)
        .showNavInfo(false)
        .nodeRelSize(4)
        .nodeOpacity(1)
        .linkWidth(5)
        .linkDirectionalParticles(5)
        .linkDirectionalParticleWidth(5)
        .backgroundColor('rgba(0,0,0,0)');
        
    graph.d3Force('center', null);
    
    // Animation
    const minOpacity = 0.15;
    const maxOpacity = 0.5;
    const gradStd = 0.005;
    let opacity = minOpacity;
    let grad = gradStd;
    let currentAngle = 0;

    const postElems = document.getElementsByClassName('post');
    const postCnt = postElems.length;
    
    // Spheres
    const sphere = [];
    for (let i = 0; i < postCnt; i++) {
        const sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x0202ff,
            wireframe: true,
            opacity: minOpacity,
            transparent: true
        });
        sphere.push(new THREE.Mesh(sphereGeometry, sphereMaterial));
    }
    
    // Posts
    let selected = -1;
    for (let i = 0; i < postCnt; i++) {
        postElems[i].onmouseenter = function() {
            selected = i;
            opacity = minOpacity;
        }

        postElems[i].onmouseleave = function() {
            selected = -1;
            sphere[i].material.opacity = minOpacity;
        }
    };

    // Metrics
    function recalc() {
        const vh_px = window.innerHeight;
        const padding_px = 34;
        const paginatorH_px = 40;
        const postGap_px = 6;
        const paddingX_px = 30;
        const searchform = document.getElementById('user-post-form');
        const offsetY_px = searchform.offsetTop + searchform.clientHeight;
        const postsContainer = document.getElementById('posts-container');
        postsContainer.style.height = `calc(100vh - ${offsetY_px + 1}px)`;
        const postsH_px = vh_px - offsetY_px - 1 - padding_px * 2 - paginatorH_px;
        const firstCenterY_px = offsetY_px + 1 + padding_px;
        const postsH_u = radius * 2 * 5 + forceMaxD * 5;
        ratio = 1.0 * postsH_u / postsH_px;
        vh_u = vh_px * ratio;
        graph.camera().fov = 10;
        distance = vh_u / (2 * Math.atan((graph.camera().fov / 2) * (Math.PI / 180)));
        firstCenterY_u = ratio * firstCenterY_px;
        postGap_u = ratio * postGap_px;
        const postW_px = postsContainer.clientWidth;
        postW_u = ratio * postW_px;
        paddingX_u = ratio * paddingX_px;

        const radius_px = radius / ratio;
        for (let i = 0; i < postCnt; i++) {
            postElems[i].style.marginLeft = (radius_px + paddingX_px) + 'px';
            postElems[i].style.paddingLeft = radius_px * 2 + 'px';
            postElems[i].style.height = (postsH_px / 5 - postGap_px) + 'px';
        };

        /* const aspectRatio = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(
            -aspectRatio * vh_u / 2,  // Left
            aspectRatio * vh_u / 2,   // Right
            vh_u / 2,                 // Top
            -vh_u / 2,                // Bottom
            0.1,                 // Near
            10000                // Far
        );
        graph.camera(camera); */
        redraw();
    }

    recalc();

    window.onresize = function () {
        recalc();
    }

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

    const animate = () => {
        requestAnimationFrame(animate);

        graph.cameraPosition({
            x: distance * Math.sin(deg2rad(currentAngle)),
            z: distance * Math.cos(deg2rad(currentAngle))
        }, {
            x: (postW_u / 2 - radius * 2 - paddingX_u) * Math.sin(deg2rad(currentAngle + 90)),
            z: (postW_u / 2 - radius * 2 - paddingX_u) * Math.cos(deg2rad(currentAngle + 90))
        });

        currentAngle += 0.5;

        if (selected != -1) {
            opacity += grad;
            if (opacity >= maxOpacity) grad = -gradStd;
            else if (opacity <= minOpacity) grad = gradStd;
            
            sphere[selected].material.opacity = opacity;
        }

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
        //const colors = ['#3ff', '#ff3', '#f3f', '#f33', '#33f'];

        const graphData = (seeds) => {
            const sds = seeds.split(' ');
            let nodes = [];
            const links = [];

            const interval = radius * 2 + forceMaxD;//graphElement.clientHeight / (sds.length + 1);

            for (let idx = 0; idx < sds.length; idx++) {
                let random = lcg(Math.round(sds[idx] * 100) + idx);
                //const centerY = idx * interval - (sds.length - 1) * interval / 2; // Center position for each group on the y-axis
                const centerY = vh_u / 2 - interval / 2 - firstCenterY_u - idx * interval + postGap_u; // Center position for each group on the y-axis
                const newnodes = [...Array(N).keys()].map(i => {
                    const node = {
                        id: i + idx * N,
                        val: (random() * 1.5) + 1,
                        color: '#33f',//colors[idx],
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

                sphere[idx].position.set(0, centerY, 0);
                graph.scene().add(sphere[idx]);
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

        /* 
        // Test Ruler
        const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -vh_u / 2, 0),  // Start point at Y = -250
            new THREE.Vector3(0, vh_u / 2, 0)    // End point at Y = 250
        ]);

        // Create a material for the line
        const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });  // Green color

        // Create the line using the geometry and material
        const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);

        // Add the Y-axis to the scene
        scene.add(yAxis);

        // Add ruler intervals every 50 units
        const intervalLength = 50;  // Length of the interval markers
        const intervalDistance = 50;  // Distance between intervals

        for (let i = -vh_u / 2; i <= vh_u / 2; i += intervalDistance) {
            const intervalGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-intervalLength / 2, i, 0),
                new THREE.Vector3(intervalLength / 2, i, 0)
            ]);

            const intervalLine = new THREE.Line(intervalGeometry, yAxisMaterial);
            scene.add(intervalLine);
        }

        const yAxisMaterial1 = new THREE.LineBasicMaterial({ color: 0xff0000 });  // Green color
        const intervalGeometry1 = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-intervalLength / 2, 0, 0),
            new THREE.Vector3(intervalLength / 2, 0, 0)
        ]);
        const intervalLine1 = new THREE.Line(intervalGeometry1, yAxisMaterial1);
        scene.add(intervalLine1); */
    }

    redraw();
}
