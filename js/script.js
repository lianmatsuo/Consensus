// Fetch edges and nodes 
fetch('Vertices.txt', {mode: 'no-cors'})
.then(response => response.text())
.then(contents => {
    // graph set up 
    var initialElements = [];
    try {
        const array = JSON.parse(contents);
        for (let i = 0; i < 100; i++) {
            initialElements.push({
                group: 'nodes',
                data: {
                    id: `${i}`,
                    color: "#808080"
                }
            });
            initialElements.push({
                group: 'edges',
                data: {
                    id: `${i}-${i}`,
                    source: i,
                    target: i,
                    weight : 1,
                }
            });
            for (let c = 0; c<array[i].length; c++) {
                initialElements.push({
                    group: 'edges',
                    data: {
                        id: `${i}-${array[i][c]}`,
                        source: i,
                        target: array[i][c],
                        weight: 1,
                    }
                });
            };
        };
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }

    var cy = window.cy = cytoscape({
        container: document.getElementById('cy'),

        boxSelectionEnabled: false,
        autounselectify: true,
        userZoomingEnabled: false, 

        layout: {
            name: 'cose',
            animate: true,
            fit: true,
            randomize: false,
            nodeOverlap: 500,
        },

        style: [
        {
            selector: 'node',
            style: {
                'height': 40,
                'width': 40,
                'label': 'data(id)',
                'text-valign': 'center',
                'background-color': 'data(color)',
                'color': '#16161a'
                
            }
        },

        {
            selector: 'edge',
            style: {
                'curve-style': 'haystack',
                'haystack-radius': 0,
                'width': 5,
                'opacity': 0.5,
                'line-color': '#72757e'
            }
        }
        ],
        
        elements: initialElements
    });


    // normalise weights of edges based on nodes neighbours (0.0 <= weight range <= 1.0)
    function normalizeWeights() {
        var pValueEnabled = false
        var pValue = 0
        if(arguments.length === 1) {
            pValueEnabled = true
            pValue = arguments[0]
        }
        cy.nodes().forEach(function(node) {
            var edges = node.outgoers('edge')
            if(edges.length != 0) {
                edges.forEach(function(edge) {
                    if(pValueEnabled) {
                        if (edge.source().id() != edge.target().id()) {
                            edge.data('weight', String((1-pValue)/(edges.length-1)))
                        };
                    }
                    else {
                        edge.data('weight', String(Number(edge.data('weight'))/edges.length))
                    }
                    //console.log(edge.data())
                });
            }
        });
    };

    function iterate() {
        cy.nodes().forEach(function(node) {
            // list of neighbouring nodes 
            var neighbors = node.outgoers('node')   
            // list of outgoing edges weights from current node 
            var weights = node.outgoers('edge').map(function(edge) {
                return edge.data('weight')
            });
            //console.log(node.data())
            let cumulativeWeight = 0
            // if there are neighbours 
            if(neighbors) {
                const random = Math.random() 

                for (let i = 0; i < weights.length; i++) {
                    cumulativeWeight += Number(weights[i])

                    if (random < cumulativeWeight) {
                        let chosenNeighbor = neighbors[i]
                        // if chosen neighbouring node is not gray 
                        if(!(chosenNeighbor.data('color') == '#808080')) {
                            node.data('new-color', chosenNeighbor.data('color'))
                            //console.log(node.data())
                            //console.log(chosenNeighbor.data())
                        };
                        // a node is only grabbable to one neighbouring node
                        break;
                    };
                };
            };
        });
        changeNodeColors();
    };

    function changeNodeColors(){
        cy.nodes().forEach(function(node) {
            if(node.data('new-color') !== undefined) {
                node.animate({
                    style: { 'background-color': node.data('new-color') }
                }, {
                    duration: 1000/slider.value // ms 
                });
                node.data('color', node.data('new-color'))
            }
        });
    };
    
    // only checks consensus for one colour (red or blue)
    function checkConsensus() {
        var firstNodeValue = cy.nodes()[0].data('color');
        for(let i = 0; i< cy.nodes().length; i++) {
            if((firstNodeValue != cy.nodes()[i].data('color'))) {
                return false
            };
        };
        document.getElementById("demoEnd").style.display = "block"
        return true
    };

    function simulate() {
        // creates a max 1500ms timeout between each iteration 
        simulationTimeout = setTimeout(function() {
            if(!checkConsensus()) {
                iterate();
                simulate();
            }
            else {
                return;
            }
        }, 1500/slider.value);
    };

    function reloadGraph() {
        location.reload();
    };

    function changePValue(pValue) {
        if(pValue) {
            cy.edges().forEach(function(edge) {
                if (edge.source().id() === edge.target().id()) {
                    edge.data('weight', String(pValue))
                }
            });
            normalizeWeights(pValue)
        };
    };
    
    // modal button stuff 
    var pValueModal = document.getElementById("pValueModal");

    var pValueBtn = document.getElementById("changePBtn");

    var closeModal = document.getElementById("pValueClose");

    var closeDemoModal = document.getElementById("demoEndClose");

    pValueBtn.onclick = function() {
        if (document.getElementById('pValueLabel').textContent == 'Not valid. Please enter a value between 0-1:') {
            document.getElementById('pValueLabel').textContent = 'Please enter a value between 0-1:';
        }

        pValueModal.style.display = "block"; 
    }

    closeModal.onclick = function() {
        pValueModal.style.display = "none"
    }

    closeDemoModal.onclick = function() {
        document.getElementById("demoEnd").style.display = "none"; 
    }

    window.onclick=function(event) {
        if (event.target == pValueModal) {
            pValueModal.style.display = "none"
        } else if (event.target == document.getElementById("demoEnd")) {
            document.getElementById("demoEnd").style.display = "none";
        }
    }

    // change p value in modal through form 
    var pValueForm = document.getElementById('changePValue')

    pValueForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const newPValue = pValueForm.elements.pValue.value; 
        if (isNaN(newPValue) || newPValue < 0.0 || newPValue > 1.0){
            document.getElementById('pValueLabel').textContent = 'Not valid. Please enter a value between 0-1:'
            pValueForm.reset();
        } else {
            document.getElementById('pValueLabel').textContent = 'Please enter a value between 0-1:'
            changePValue(parseFloat(newPValue))
            pValueModal.style.display = "none";
        }
        
    });


    // Add event listeners to toolbar buttons
    document.getElementById('resetBtn').addEventListener('click', function() {
        reloadGraph()
    });
    // animates all nodes for 1 iteration 
    document.getElementById('animateBtn').addEventListener('click', function() {
        iterate()
    });
    // simulates all nodes for 50 iterations 
    document.getElementById('simulateBtn').addEventListener('click', function() {
        simulate()
    });


    document.getElementById('colorPicker').addEventListener('input', function(event) {
        // Get the selected color value
        const selectedColor = event.target.value;
        // Display the selected color value
        cy.on('tap', 'node', function(event) {
            var selectedNode = event.target;
            selectedNode.data('color', selectedColor)
            selectedNode.style('background-color', selectedColor)
            cy.off('tap', 'node');
        });
    });

    // Add event listener to the color selection buttons
    document.getElementById('selectPurpleBtn').addEventListener('click', function() {
        cy.on('tap', 'node', function(event) {
            var selectedNode = event.target;
            selectedNode.data('color', '#7f5af0')
            cy.off('tap', 'node');
        });
    });

    document.getElementById('selectGreenBtn').addEventListener('click', function() {
        cy.on('tap', 'node', function(event) {
            var selectedNode = event.target;
            selectedNode.data('color', '#2cb67d')
            cy.off('tap', 'node');
        });
    });

    var slider = document.getElementById("speed-input");
    var output = document.getElementById("speed-label")

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        output.innerHTML = "Speed Multiplier :x" + parseFloat(this.value).toFixed(1);
    }
    
    normalizeWeights()
});