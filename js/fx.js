import { UnrealBloomPass } from './three@0.123.0/examples/jsm/postprocessing/UnrealBloomPass1.js';
import * as THREE from './three@0.123.0/build/three.module.js';
import { EffectComposer } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '//unpkg.com/three@0.123.0/examples/jsm/postprocessing/RenderPass.js';

const deg2rad = deg => deg * Math.PI / 180;

const initialData = { nodes: [{ id: 0 }], links: [] };
const distance = 1500;

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

const N = [30, 10, 10, 20, 20];

(function ($) {
    $(document).ready(function () {


        /* const graphElements = [
            document.getElementById("fx-layer" + i)
        ]; */

        const graphs = $('.fx-layer').map((index, elem) => {
            const graph = ForceGraph3D()(elem)
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

            return graph;
        });

        const renderers = graphs.map((index, graph) => {
            const renderer = graph.renderer();
            renderer.setClearColor(0x000000, 0);
            renderer.toneMapping = THREE.ReinhardToneMapping;
            renderer.toneMappingExposure = Math.pow(2, 4.0);
            return renderer;
        });

        const composers = renderers.map((index, renderer) => {
            const composer = new EffectComposer(renderer);
            const renderPass = new RenderPass(graphs[index].scene(), graphs[index].camera());
            renderPass.clearAlpha = 0;
            composer.addPass(renderPass);

            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 3, 1, 0);
            if (index == 0) {
                bloomPass.strength = 2;
                bloomPass.radius = 0.85;
            }
            composer.addPass(bloomPass);

            return composer;
        });

        let currentAngle = 0;
        const animate = () => {
            requestAnimationFrame(animate);

            if (graphs.length > 0)
                graphs[0].cameraPosition({
                    x: distance * 3 / 5 * Math.sin(deg2rad(currentAngle)),
                    z: distance * 3 / 5 * Math.cos(deg2rad(currentAngle))
                });

            if (graphs.length > 1)
                graphs[1].cameraPosition({
                    x: distance * Math.sin(deg2rad(currentAngle)),
                    z: distance * Math.cos(deg2rad(currentAngle))
                }, {
                    x: distance / 4 * Math.sin(deg2rad(currentAngle + 90)),
                    z: distance / 4 * Math.cos(deg2rad(currentAngle + 90))
                });

            if (graphs.length > 2)
                graphs[2].cameraPosition({
                    x: distance * Math.sin(deg2rad(currentAngle)),
                    z: distance * Math.cos(deg2rad(currentAngle))
                }, {
                    x: distance / 4 * Math.sin(deg2rad(currentAngle - 90)),
                    z: distance / 4 * Math.cos(deg2rad(currentAngle - 90))
                });

            if (graphs.length > 3)
                graphs[3].cameraPosition({
                    x: distance * Math.sin(deg2rad(currentAngle)),
                    y: distance / 6,
                    z: distance * Math.cos(deg2rad(currentAngle))
                }, {
                    x: distance / 3,
                    y: distance / 6
                });

            if (graphs.length > 4)
                graphs[4].cameraPosition({
                    x: distance * Math.sin(deg2rad(currentAngle)),
                    y: distance / 6,
                    z: distance * Math.cos(deg2rad(currentAngle))
                }, {
                    x: (-distance / 3),
                    y: distance / 6
                });

            currentAngle += 0.5;
            
            $.each(composers, function(index, composer) {
                composer.render();
            });
        };

        animate();

        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            $.each(graphs, function(index, graph) {
                graph.width(width);
                graph.height(height);
                graph.refresh();
            });

            $.each(renderers, function(index, renderer) {
                renderer.setSize(width, height);
            });

            $.each(composers, function(index, composer) {
                composer.setSize(width, height);
            });
        });

        function redraw() {
            const graphData = (sd, color, idx) => {
                let random = lcg(Math.round(sd * 100) + idx);
                const nodes = [...Array(N[idx]).keys()].map(i => ({
                    id: i,
                    val: (random() * 1.5) + 1,
                    color
                }));

                const links = [];
                $.each(nodes, function(index, node) {
                    const numNodeLinks = Math.round(random() * (0.75 + random())) + 1;
                    for (let i = 0; i < numNodeLinks; i++) {
                        links.push({
                            source: node.id,
                            target: Math.round(random() * (node.id > 0 ? node.id - 1 : node.id))
                        });
                    }
                });

                return { nodes, links };
            };

            const colors = ['#3ff', '#ff3', '#f3f', '#f33', '#33f'];

            $.each(graphs, function(index, graph) {
                const gData = graphData($('.fx-layer').eq(index).data('seed'), colors[index], index);
                graph.graphData(gData)
                    .nodeAutoColorBy(null)
                    .nodeColor(node => node.color);
            });
        }

        redraw();

        /* $('.search-btn').on('click', function (e) {
            e.preventDefault();
            $.ajax({
                url: custom_ajax_object.ajax_url,
                type: 'POST',
                data: {
                    action: 'handle_search_ajax',
                    nonce: custom_ajax_object.nonce,
                    search_text: $('.search-input').val()
                },
                success: function (response) {
                    redraw(response);
                },
                error: function (xhr, status, error) {
                    redraw(0);
                }
            });
        }); */
    });
})(jQuery);
