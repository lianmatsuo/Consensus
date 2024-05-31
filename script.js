fetch('data.json', {mode: 'no-cors'})
.then(function(res) {
    return res.json()
})
.then(function(data) {
    var initialElements
    var cy = window.cy = cytoscape({
        container: document.getElementById('cy'),

        boxSelectionEnabled: false,
        autounselectify: true,

        layout: {
            name: 'grid'
        },

        style: [
        {
            selector: 'node',
            style: {
                'height': 20,
                'width': 20,
                'label': 'data(id)',
                'text-valign': 'center',
                'background-color': 'data(color)'
            }
        },

        {
            selector: 'edge',
            style: {
                'curve-style': 'haystack',
                'haystack-radius': 0,
                'width': 5,
                'opacity': 0.5,
                'line-color': '#000000'
            }
        }
        ],

        elements: data
    });
    
    var nodes = cy.nodes()
    nodes[0].data('color','#ff0000')
    nodes[1].data('color','#0000ff')
    initialElements = cy.elements().jsons();
    normalizeWeights()

    function normalizeWeights() {
        nodes.forEach(function(node) {
            var edges = node.outgoers('edge')
            var totalweight = 0
            edges.forEach(function(edge) {
                totalweight+=Number(edge.data('weight'))
            });
            if(totalweight != 0) {
                edges.forEach(function(edge) {
                    edge.data('weight', String(Number(edge.data('weight'))/totalweight))
                    //console.log(edge.data())
                });
            }
        });
    };

    function animate() {
        nodes.forEach(function(node) {
            var neighbors = node.outgoers('node')
            var weights = node.outgoers('edge').map(function(edge) {
                return edge.data('weight')
            });
            let cumulativeWeight = 0
            if(neighbors) {
                const random = Math.random() 
                for (let i = 0; i < weights.length; i++) {
                    cumulativeWeight += Number(weights[i])
                    if (random < cumulativeWeight) {
                        let chosenNeighbor = neighbors[i]
                        if(!(chosenNeighbor.data('color') == '#808080')) {
                            node.animate({
                                style: { 'background-color': chosenNeighbor.data('color') }
                            }, {
                                duration: 1000
                            })
                            node.data('color', chosenNeighbor.data('color'))
                            console.log(node.data())
                            console.log(chosenNeighbor.data())
                        };
                        break;
                    };
                };
            };
        });
    };

    function reloadGraph() {
        cy.elements().remove();
        cy.add(initialElements);
        normalizeWeights();
        console.clear();
        nodes = cy.nodes()
    }

    // Add event listeners to toolbar buttons
    document.getElementById('resetBtn').addEventListener('click', function() {
        reloadGraph();
    });

    document.getElementById('animateBtn').addEventListener('click', function() {
        animate();
    });
});