import { UnrealBloomPass } from './three@0.123.0/examples/jsm/postprocessing/UnrealBloomPass1.js';
import * as THREE from './three@0.123.0/build/three.module.js';
import { EffectComposer } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/RenderPass.js';

const graphElement = document.getElementById("fx-layer");

if (graphElement) {

    // Graph values
    const N = 30;
    const radius = 100;
    const radiusShrink = 0.8;
    const forceMaxD = 100;

    // Camera values
    let distance = 1000;//1600 / (2 * Math.atan((graph.camera().fov / 2) * (Math.PI / 180)));
    let ratio = 1;

    // Metric values
    let vh_u = 0;
    let centerY_u = 0;
    let offsetX_u = 0;
    let postW_u = 0;
    let postLPadRatio = 0.5;

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
        .linkWidth(3)
        .linkDirectionalParticles(5)
        .linkDirectionalParticleWidth(3)
        .backgroundColor('rgba(0,0,0,0)');

    graph.d3Force('center', null);

    // Animation
    const minOpacity = 0.15;
    const maxOpacity = 0.5;
    const gradStd = 0.005;
    let opacity = minOpacity;
    let grad = gradStd;
    let currentAngle = 0;

    const postElem = document.querySelector('.entry-content p');

    // Spheres
    const sphereGeometry = new THREE.SphereGeometry(radius, 12, 12);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x0202ff,
        wireframe: true,
        opacity: minOpacity,
        transparent: true
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Posts
    postElem.onmouseenter = function () {
        opacity = minOpacity;
    }

    postElem.onmouseleave = function () {
        sphere.material.opacity = minOpacity;
    }

    // Metrics
    function recalc() {
        const postPaddingLeftExtend = 1;
        
        const vh_px = window.innerHeight;
        const titleblock = document.getElementById('title-block');
        const offsetY_px = titleblock.offsetTop + titleblock.clientHeight;
        const offsetX_px = postElem.offsetLeft;
        const postW_px = postElem.clientWidth;
        
        if (window.innerWidth < 800) {
            postLPadRatio = 1;
            document.querySelectorAll('.entry-content p').forEach(elem => {elem.style.paddingLeft = 0;});
            postElem.style.marginTop = postW_px + 'px';
        } else {
            postLPadRatio = 0.5;
            document.querySelectorAll('.entry-content p').forEach(elem => {elem.style.paddingLeft = postLPadRatio * postW_px * postPaddingLeftExtend + 'px';});
            postElem.style.marginTop = postW_px * postLPadRatio / 2 * (1 - radiusShrink) * 2 + 'px';
        }
        const radius_px = postW_px * postLPadRatio / 2 * radiusShrink;
        const centerY_px = offsetY_px + 1 + postW_px * postLPadRatio / 2;
        ratio = 1.0 * radius / radius_px;
        vh_u = vh_px * ratio;
        //graph.camera().fov = 10;
        distance = vh_u / (2 * Math.atan((graph.camera().fov / 2) * (Math.PI / 180)));
        centerY_u = centerY_px * ratio;
        offsetX_u = offsetX_px * ratio;
        postW_u = postW_px * ratio;

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

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 2, 1, 0);
    composer.addPass(bloomPass);

    const animate = () => {
        requestAnimationFrame(animate);

        graph.cameraPosition({
            x: distance * Math.sin(deg2rad(currentAngle)),
            z: distance * Math.cos(deg2rad(currentAngle))
        }, {
            x: (postW_u * (1 - postLPadRatio * 2) / 2 + radius / radiusShrink) * Math.sin(deg2rad(currentAngle + 90)),
            z: (postW_u * (1 - postLPadRatio * 2) / 2 + radius / radiusShrink) * Math.cos(deg2rad(currentAngle + 90))
        });

        currentAngle += 0.5;

        opacity += grad;
        if (opacity >= maxOpacity) grad = -gradStd;
        else if (opacity <= minOpacity) grad = gradStd;

        sphere.material.opacity = opacity;

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

    function redraw() {
        //const colors = ['#3ff', '#ff3', '#f3f', '#f33', '#33f'];

        const graphData = (seed) => {

            let random = lcg(Math.round(seed * 100));
            //const centerY = idx * interval - (sds.length - 1) * interval / 2; // Center position for each group on the y-axis
            const centerY = vh_u / 2 - centerY_u; // Center position for each group on the y-axis
            const nodes = [...Array(N).keys()].map(i => {
                const node = {
                    id: i,
                    val: (random() * 1.5) + 1,
                    color: '#33f',//colors[idx],
                    group: 1
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

            const links = [];
            nodes.forEach(node => {
                const numNodeLinks = Math.round(random() * (0.75 + random())) + 1;
                for (let i = 0; i < numNodeLinks; i++) {
                    let target = Math.round(random() * (node.id > 0 ? node.id - 1 : node.id));
                    if (node.id != target && links.filter(link => link.source == node.id && link.target == target).length == 0)
                        links.push({
                            source: node.id,
                            target: target,
                            length: 50
                        });
                }
            });


            graph.d3Force('radial1', forceRadial3D(0, 0, centerY, 0, d => d.group === 1 ? 0.1 : 0));

            sphere.position.set(0, centerY, 0);
            graph.scene().add(sphere);

            return { nodes, links };
        };

        const gData = graphData(localized_obj.seed);
        const links = gData.links;
        graph.graphData(gData)
            .nodeAutoColorBy(null)
            .nodeColor(node => node.color);

        graph.d3Force('link')
            .id(d => d.id)
            .distance(link => link.length);

        graph.d3Force('charge')
            .distanceMax(200);
    }

    redraw();
}
