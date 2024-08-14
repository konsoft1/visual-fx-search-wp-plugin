import { UnrealBloomPass } from './three@0.123.0/examples/jsm/postprocessing/UnrealBloomPass1.js';
import * as THREE from './three@0.123.0/build/three.module.js';
import { EffectComposer } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/RenderPass.js';

const graphElement = document.getElementById("fx-layer");

if (graphElement) {
    const deg2rad = deg => deg * Math.PI / 180;
    
    const initialData = { nodes: [{ id: 0 }], links: [] };
    const distance = 2000;
    
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
    
    const N = 40;

    const graph = ForceGraph3D()(document.getElementById("fx-layer"))
        .enableNodeDrag(false)
        .enableNavigationControls(false)
        .enablePointerInteraction(false)
        .showNavInfo(false)
        .cameraPosition({ z: distance })
        .nodeRelSize(4)
        .nodeOpacity(1)
        .linkWidth(5)
        .linkDirectionalParticles(5)
        .linkDirectionalParticleWidth(5)
        .backgroundColor('rgba(0,0,0,0)');


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
            x: distance * 3 / 5 * Math.sin(deg2rad(currentAngle)),
            y: distance * 1 / 5,
            z: distance * 3 / 5 * Math.cos(deg2rad(currentAngle))
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

    function redraw() {
        const colors = ['#3ff', '#ff3', '#f3f', '#f33', '#33f'];

        const graphData = (seeds) => {
            const sds = seeds.split(' ');
            let nodes = [];
            const links = [];

            for (let idx = 0; idx < sds.length; idx++) {

                let random = lcg(Math.round(sds[idx] * 100) + idx);
                const newnodes = [...Array(N).keys()].map(i => ({
                    id: i + idx * N,
                    val: (random() * 1.5) + 1,
                    color: colors[idx]
                }));
                nodes = nodes.concat(newnodes);

                newnodes.forEach(node => {
                    const numNodeLinks = Math.round(random() * (0.75 + random())) + 1;
                    for (let i = 0; i < numNodeLinks; i++) {
                        let target = Math.round(random() * (node.id > idx * N ? node.id - idx * N - 1 : node.id - idx * N)) + idx * N;
                        links.push({
                            source: node.id,
                            target: target
                        });
                    }
                });
            }

            return { nodes, links };
        };


        const gData = graphData(document.getElementById('fx-layer').getAttribute('data-seed'));
        graph.graphData(gData)
            .nodeAutoColorBy(null)
            .nodeColor(node => node.color);
    }

    redraw();
}