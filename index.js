// import the GraphClass definiton from GraphClass.js
import GraphClass from './GraphClass.js';

/*
    Given some JSON data representing a graph, render it with D3
*/
// dummy commit
function renderGraph(graphData, imgData) {
    d3.select("#graphviz svg").remove();
    let graphObj = new GraphClass();
    graphObj.graph = graphData;
    for (let i = 0; i < graphObj.graph.nodes.length; i++) {
        let cast_list = graphObj.graph.nodes[i]["cast_name"].split(",");
        graphObj.graph.nodes[i]["cast_name"] = cast_list;
        let director_list = graphObj.graph.nodes[i]["director_name"].split(",");
        graphObj.graph.nodes[i]["director_name"] = director_list;
        let writer_list = graphObj.graph.nodes[i]["writter_name"].split(",");
        graphObj.graph.nodes[i]["writter_name"] = writer_list;
        let genre_list = graphObj.graph.nodes[i]["genre"].split(",");
        graphObj.graph.nodes[i]["genre"] = genre_list;
        for (let j = 0; j < graphObj.graph.nodes.length; j++) {
            if (imgData[i].id == graphObj.graph.nodes[j].id) {
                graphObj.graph.nodes[j].img_link = imgData[i].large_img_link;
                graphObj.graph.nodes[j].small_img_link = imgData[i].small_img_link;
            }
        }
    }
    displayGraphStatistics(graphObj);
    forceGraph(graphObj);
    var toggle = document.getElementById("layout-toggle")
    toggle.addEventListener('change', (e) => {
        document.getElementById("node-search").value = "";
        if (e.currentTarget.checked) {
            d3.select("#graphviz svg").remove();
            document.getElementById("layout-name").textContent = "Hierarchial Edge Bundling"
            radialGraph(graphObj);
        } else {
            d3.select("#graphviz svg").remove();
            document.getElementById("layout-name").textContent = "Force-Directed"
            forceGraph(graphObj);
        }
    })
    
}

function forceGraph(graphObj) {
    displayGraphStatistics(graphObj);
    d3.select("#graphviz svg").remove();
    document.getElementById("dropdown-menu").replaceChildren();
    document.getElementById("comp-toggle").checked = false;
    var graphData = graphObj.graph;
    var editMode = false; 
    let connectedComp = graphObj.findLargestConnectedComponent();
    let connectedCompGraph = new GraphClass();
    connectedCompGraph.graph = connectedComp;

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    var links = graphObj.graph.edges.map(d => ({...d}));
    var nodes = graphObj.graph.nodes.map(d => ({...d}));
    // Create a simulation with several forces.
    const width = window.innerWidth;
    const height = (window.innerHeight*95)/100;
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).distance(20).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-70))
        .force("x", d3.forceX(window.innerWidth / 2))
        .force("y", d3.forceY(window.innerHeight / 2))
        .on("tick", ticked);

  // Create the SVG container.
    const svg = d3.select("#graphviz").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;")

    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke", "#e0dede")
    .attr("stroke-opacity", "0.4");

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
    .attr("r", 6)
    .attr("fill", d => {
        if (d.group == "new") {
            return "#2effbd"; 
        } else if (d.group == "updated") {
            return "#ff5100"
        } 
        return "#b36bff";
    })
    .attr("id", d => d.id);

    node.append("title")
        .text(d => d.id);

    const movieName = document.getElementById("movieName");
    const moviePoster = document.getElementById("moviePoster");
    const movieRank = document.getElementById("movieRank");
    const releaseYear = document.getElementById("releaseYear");
    const imdbRating = document.getElementById("imdbRating");
    const durationTime = document.getElementById("durationTime");
    const genre = document.getElementById("genre");
    const directorName = document.getElementById("directorName");
    const movieID = document.getElementById("movieID");
    node.on("mouseover", (f, d) => {
            movieName.textContent = d.name;
            moviePoster.style.visibility = "true";
            moviePoster.src = d.img_link;
            movieRank.textContent = d.rank;
            releaseYear.textContent = d.year;
            imdbRating.textContent = d.imdb_rating;
            durationTime.textContent = d.duration;
            genre.textContent = d.genre.join(", ");
            directorName.textContent = d.director_name.join(", ");
            movieID.textContent = d.id;

            node.attr("r", (d1) => {
                if (d1.id == d.id) {
                    return 7.5;
                } 
                return 6;
            })
        })
        .on("mouseout", (f, d) => {
            movieName.textContent = "Hover Over Node";
            moviePoster.style.visibility = "false";
            moviePoster.src = "";
            movieRank.textContent = "Hover Over Node";
            releaseYear.textContent = "Hover Over Node";
            imdbRating.textContent = "Hover Over Node";
            durationTime.textContent = "Hover Over Node";
            genre.textContent = "Hover Over Node";
            directorName.textContent = "Hover Over Node";
            movieID.textContent = "Hover Over Node";
            node.attr("r", () => {
                return 6;
            })
        })

    node.on("click", (e1, d1) => {
        editMode = true;
        const selectedNode = document.getElementById(d1.id);
        selectedNode.style.fill = "#b36bff";
        node.attr("fill", "#fff")
            .on("mouseover", (f, d_mid) => {
                const hoverNode = document.getElementById(d_mid.id);
                if (d_mid.id != d1.id) {
                    hoverNode.style.fill = "#000";
                } 
            })
            .on("mouseout", (f, d_mid) => {
                const hoverNode = document.getElementById(d_mid.id);
                if (d_mid.id != d1.id) {
                    hoverNode.style.fill = "#fff";
                }
            })
        node.on("click", (e2, d2) => {
            editMode = false;
            if (d1.id == d2.id) {
                window.alert("Self-loops not supported in current version!")
            } else if (
                (graphData.edges.find(n => n.source == d1.id && n.target == d2.id)) || 
                (graphData.edges.find(n => n.source == d2.id && n.target == d1.id))) {
                    window.alert("Edge already exists!")
            } else {
                const newEdge = {
                    source: d1.id,
                    target: d2.id,
                    group: "new"
                }
                graphData.edges.push(newEdge);
                for (let i in graphData.nodeDegrees) {
                    if (i == d1.id || i == d2.id) {
                        graphData.nodeDegrees[i] += 1;
                    }
                }
                for (let i in graphData.nodes) {
                    if (graphData.nodes[i].group == "updated") {
                        graphData.nodes[i].group = "";
                    }
                    if (graphData.nodes[i].id == d1.id || graphData.nodes[i].id == d2.id) {
                        graphData.nodes[i].group = "updated";
                    }
                }

            }
            forceGraph(graphObj);
        })
    });

    // Add a drag behavior.
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    node.on("contextmenu", (e, d) => {
        e.preventDefault();
        var position = d3.pointer(e);
        var con_menu = d3.select('#context_menu_node');
        
        con_menu.style('position', 'absolute')
            .style('left', position[0] + "px")
            .style('top', position[1] - 20 + "px")
            .style('display', 'block');
        
        d3.selectAll("body")
        .on("click", (e1) => {
            con_menu.style('display', 'none');
        })

        var modify_node = d3.select("#modify_node_button");
        var delete_node = d3.select("#delete_node_button");
        var delete_edge = d3.select("#delete_edge_button");

        modify_node.on("click", (e) => {
            var nodeBox = document.getElementById("node-box").style
            nodeBox.backgroundColor = "black";
            var node_change = d3.select("#change_node");
            node_change.style('display', 'block');
            // ^(?:[^,]+,)*[^,]+$
            // ^(?:[A-Za-z]+(?:[ ]?[A-Za-z-]+)?, ?)*(?:[A-Za-z]+(?:[ ]?[A-Za-z-]+)?)$
            var re = new RegExp("^(?:[^,]+,)*[^,]+$")
            var name_field = document.getElementById("mod_movName");
            var rank_field = document.getElementById("mod_movRank");
            var id_field = document.getElementById("mod_id");
            var cast_field = document.getElementById("mod_cast");
            var writer_field = document.getElementById("mod_writer");
            var genre_field = document.getElementById("mod_genre");
            var dir_field = document.getElementById("mod_dir");
            
            movieName.textContent = name_field.value = d.name;
            moviePoster.style.visibility = "true";
            moviePoster.src = d.img_link;
            movieRank.textContent = rank_field.value = d.rank;
            releaseYear.textContent = d.year;
            imdbRating.textContent = d.imdb_rating;
            durationTime.textContent = d.duration;
            genre.textContent = genre_field.value = d.genre.join(", ");
            directorName.textContent = dir_field.value = d.director_name.join(", ");
            movieID.textContent = id_field.value = d.id;
            cast_field.value = d.cast_name.join(", ");
            writer_field.value = d.writter_name.join(", ");
            
            var valid_input = true;

            name_field.addEventListener("keyup", function(eq) {
                movieName.textContent = eq.target.value; 
            })
            rank_field.addEventListener("keyup", function(ew) {
                movieRank.textContent = ew.target.value; 
            })
            id_field.addEventListener("keyup", function(er) {
                movieID.textContent = er.target.value; 
            })
            cast_field.addEventListener("keyup", function(et) {
                if (re.test(et.target.value)) {
                    cast_field.style.color = "black";
                } else {
                    cast_field.style.color = "red";
                } 
            })
            writer_field.addEventListener("keyup", function(ey) {
                if (re.test(ey.target.value)) {
                    writer_field.style.color = "black";
                } else {
                    writer_field.style.color = "red";
                } 
            })
            genre_field.addEventListener("keyup", function(ez) {
                genre.textContent = ez.target.value;
                if (re.test(ez.target.value)) {
                    genre_field.style.color = "black";
                } else {
                    genre_field.style.color = "red";
                }
            })
            dir_field.addEventListener("keyup", function(ex) {
                dir_field.textContent = ex.target.value;
                if (re.test(ex.target.value)) {
                    dir_field.style.color = "black";
                } else {
                    dir_field.style.color = "red";
                }
            })
            d3.select("#close-con")
                .on("click", (e) => {
                    if (re.test(genre_field.value) & re.test(dir_field.value) & re.test(cast_field.value) & re.test(writer_field.value)) {
                        valid_input = true;
                    } else {
                        valid_input = false;
                    }
                    if (valid_input) {
                        for (let i = 0; i < graphData.nodes.length; i++) {
                            if (graphData.nodes[i].id == d.id) {
                                var node_changed = graphData.nodes[i];
                                    var id_change = graphData.nodes[i].id;
                                    node_changed.name = name_field.value;
                                    node_changed.rank = rank_field.value;
                                    node_changed.id = id_field.value;
                                    node_changed.genre = genre_field.value.split(", ");
                                    node_changed.director_name = dir_field.value.split(", ");
                                    node_changed.cast_name = cast_field.value.split(", ");
                                    node_changed.writter_name = writer_field.value.split(", ");
                                    node_changed.group = "updated";
                                    if (id_field.value != id_change) {
                                        for (let j = 0; j < graphData.edges.length; j++) {
                                            if (graphData.edges[j].source == id_change) {
                                                graphData.edges[j].source = id_field.value
                                            } else if (graphData.edges[j].target == id_change) {
                                                graphData.edges[j].target = id_field.value
                                            }
                                        }
                                        let deg_change = Object.keys(graphData.nodeDegrees);
                                        for (let j = 0; j < deg_change.length; j++) {
                                            if (deg_change == id_change) {
                                                var deg = graphData.nodeDegrees[id_change];
                                                delete graphData.nodeDegrees[id_change];
                                                graphData.nodeDegrees[id_field.value] = deg;
                                            }
                                        }
                                        forceGraph(graphObj);
                                    }
                            }
                        }
                        node_change.style('display', 'none');
                        nodeBox.backgroundColor = "#25252559";
                        forceGraph(graphObj);
                    }
                    else {
                        window.alert("One of your inputs is invalid. Please correct it before closing this window!")
                    }
                    
                })
            
        })
        delete_node.on("click", (e) => {
            var winConf = window.confirm("Are you sure you want to delete this node?")
            if (winConf) {
                for (let i = 0; i < graphData.nodes.length; i++) {
                    if (graphData.nodes[i].id == d.id) {
                        graphData.nodes.splice(i, 1);
                    }
                }
                for (let i = 0; i < graphData.edges.length; i++) {
                    if (graphData.edges[i].source == d.id || graphData.edges[i].target == d.id) {
                        graphData.edges.splice(i, 1);
                    }
                }
            }
            forceGraph(graphObj);
        })

        delete_edge.on("click", (e) => {
            var edge_nodes = [];
            for (let i = 0; i < graphData.edges.length; i++) {
                if (graphData.edges[i].source == d.id) {
                    edge_nodes.push(graphData.edges[i].target);
                } else if (graphData.edges[i].target == d.id) {
                    edge_nodes.push(graphData.edges[i].source);
                }
            }
            node.attr("fill", (d1) => {
                if (d1.id == d.id) {
                    return "rgba(0, 0, 0, 1)";
                } 
                if (edge_nodes.includes(d1.id)) {
                    return "rgba(179, 107, 255, 1)";
                }
                return "rgba(179, 107, 255, 0.3)";
            })
            .attr("r", (d1) => {
                if (d1.id == d.id) {
                    return "7.1";
                } 
                if (edge_nodes.includes(d1.id)) {
                    return "7.1";
                }
                return "3";
            })
            .attr("stroke-opacity", (d1) => {
                if (d1.id == d.id) {
                    return "1.6";
                } 
                if (edge_nodes.includes(d1.id)) {
                    return "1.6";
                }
                return "0.6";
            })

            node.on("click", (e, d1) => {
                if (edge_nodes.includes(d1.id)) {
                    var edgeConf = window.confirm("Are you sure you want to delete this edge?")
                    if (edgeConf) {
                        for (let i = 0; i < graphData.edges.length; i++) {
                            if ((d1.id == graphData.edges[i].source || d1.id == graphData.edges[i].target) && (d.id == graphData.edges[i].source || d.id == graphData.edges[i].target)) {
                                graphData.edges.splice(i, 1);
                            }
                        }
                        for (let i = 0; i < graphData.nodes.length; i++) {
                            if (graphData.nodes[i].id == d1.id || graphData.nodes[i].id == d.id) {
                                graphData.nodes[i].group = "updated";
                            }
                        }
                    }
                } else {
                    window.alert("Edge does not exist!");
                    node.attr("stroke", "#fff")
                        .attr("stroke-opacity", "1")
                        .attr("stroke-width", 1.5)
                        .attr("r", 6)
                        .attr("fill", d => {
                            if (d.group == "new") {
                                return "#2effbd"; 
                            } else if (d.group == "updated") {
                                return "#ff5100"
                            } 
                            return "#b36bff";
                        })
                }
                forceGraph(graphObj);
            })
        })
    })
    
    var switchSearchVal = "id";
    var list_attr = ["genre", "cast_name", "director_name", "writter_name"];
    const switchSearch = d3.select("#switchSearch")
    .on("change", function (e) {
        var searchText = document.getElementById("searchText");
        if (e.target.value == 7) {
            e.target.value = 0;
        }
        if (e.target.value == -1) {
            e.target.value = 6;
        }
        if (e.target.value == 0) {
            searchText.innerText = "ID";
            switchSearchVal = "id";
        }
        else if (e.target.value == 1) {
            searchText.textContent = "Rank";
            switchSearchVal = "rank";
        }
        else if (e.target.value == 2) {
            searchText.innerText = "Name";
            switchSearchVal = "name";
        }
        else if (e.target.value == 3) {
            searchText.innerText = "Genre";
            switchSearchVal = "genre";
        }
        else if (e.target.value == 4) {
            searchText.innerText = "Cast Name";
            switchSearchVal = "cast_name";
        }
        else if (e.target.value == 5) {
            searchText.innerText = "Director Name";
            switchSearchVal = "director_name";
        }
        else if (e.target.value == 6) {
            searchText.innerText = "Writer Name";
            switchSearchVal = "writter_name";
        }
        var elements = new Set();
        if (list_attr.includes(switchSearchVal)) {
            for (let i = 0; i < graphData.nodes.length; i++) {
                for (var j = 0; j < graphData.nodes[i][switchSearchVal].length; j++) {
                    elements.add(graphData.nodes[i][switchSearchVal][j])
                }
            }      
        } else {
            for (let i = 0; i < graphData.nodes.length; i++) {
                elements.add(graphData.nodes[i][switchSearchVal])
            }
        }
        let dropdownMenu = document.getElementById("dropdown-menu");
        dropdownMenu.innerHTML = '';
        if (!dropdownMenu.children.length >= 1) {
            for (let i = 0; i < elements.size; i++) {
                var value = Array.from(elements)[i];
                var idValue = value.split(" ").join("_");
                var nodeDropDown = document.createElement("a");
                nodeDropDown.classList.add("node-dropdown")
                nodeDropDown.setAttribute("id", "node-" + idValue);
                nodeDropDown.textContent = value;
                dropdownMenu.appendChild(nodeDropDown);
            }
        }
    })

    const largestCompToggle = document.getElementById("comp-toggle");
    largestCompToggle.addEventListener("change", (e) => {
        if (editMode) {
            window.alert("Please add an edge before switching layouts!")
            document.getElementById("comp-toggle").checked = false;
            return;
        }
        document.getElementById("node-search").value = "";
        if (e.target.checked) {
            displayGraphStatistics(connectedCompGraph);
            node.attr("fill", (d) => {
                let compNodes = connectedComp.nodes.map(n => n.id)
                if (compNodes.includes(d.id)) {
                    return "rgba(179, 107, 255, 1)";
                } 
                return "rgba(179, 107, 255, 0.3)";
            })
            .attr("r", (d) => {
                let compNodes = connectedComp.nodes.map(n => n.id)
                if (compNodes.includes(d.id)) {
                    return "7.1";
                }
                return "3";
            })
            .attr("stroke-opacity", (d) => {
                let compNodes = connectedComp.nodes.map(n => n.id)
                if (compNodes.includes(d.id)) {
                    return "1.6";
                }
                return "0.6";
            })
            link.attr("stroke-opacity", (d) => {
                let compNodes = connectedComp.nodes.map(n => n.id)
                if (!compNodes.includes(d.source.id) && !compNodes.includes(d.target.id)) {
                    return "0.1";
                }
                return "0.5";
            })
            .attr("stroke", (d) => {
                let compNodes = connectedComp.nodes.map(n => n.id)
                if (compNodes.includes(d.source.id) || compNodes.includes(d.target.id)) {
                    return "#fff";
                }
                return "#e0dede";
            })
        } else {
            displayGraphStatistics(graphObj);
            node.attr("fill", d => {
                if (d.group == "new") {
                    return "#2effbd"; 
                } else if (d.group == "updated") {
                    return "#ff5100"
                }
                return "#b36bff";
            })
            .attr("r", "6")
            .attr("stroke-opacity", "1")
            link.attr("stroke-opacity", "0.4")
            .attr("stroke", (d) => {
                let compNodes = connectedComp.nodes.map(n => n.id)
                if (compNodes.includes(d.source.id) || compNodes.includes(d.target.id)) {
                    return "#fff";
                }
                return "#e0dede";
            })
        }
    });

        const dropdownMenu = document.getElementById("dropdown-menu");
    if (!dropdownMenu.children.length >= 1) {
        for (let i = 0; i < graphData.nodes.length; i++) {
            var nodeDropDown = document.createElement("a");
            nodeDropDown.classList.add("node-dropdown")
            nodeDropDown.setAttribute("id", "node-" + graphData.nodes[i][switchSearchVal]);
            nodeDropDown.textContent = graphData.nodes[i][switchSearchVal];
            dropdownMenu.appendChild(nodeDropDown);
        }
    }

    const newNodeAdd = d3.select("#add-node")
        .on("click", function(e) {
            if (document.getElementById("node-name").value == '') {
                window.alert("Add a node name first!")
            } else if (graphData.nodes.some(node => node.id == document.getElementById("node-name").value)) {
                window.alert("This node already exists!")
            } else {
                const newNode = {
                    id: document.getElementById("node-name").value,
                    group: "new"
                    };
                graphData.nodeDegrees[document.getElementById("node-name").value] = 0;
                document.getElementById("node-name").value = "";
                graphData.nodes.push(newNode);
                forceGraph(graphObj);
            }
        })

    d3.select("#node-search")
        .on("keyup", function(e) {
            if (editMode) {
                window.alert("Please add an edge before searching for nodes!")
                document.getElementById("node-search").value = "";
                dropdownMenu.classList.toggle("show"); 
                return;
            }
            if (document.getElementById("comp-toggle").checked == true) {
                document.getElementById("comp-toggle").checked = false;
                node.attr("fill", d => {
                    if (d.group == "new") {
                        return "#2effbd"; 
                    } else if (d.group == "updated") {
                        return "#ff5100"
                    }
                    return "#b36bff";
                })
                .attr("r", "6")
                .attr("stroke-opacity", "1")
                link.attr("stroke-opacity", "0.4")
                .attr("stroke", (d) => {
                    let compNodes = connectedComp.nodes.map(n => n.id)
                    if (compNodes.includes(d.source.id) || compNodes.includes(d.target.id)) {
                        return "#fff";
                    }
                    return "#e0dede";
                })
            }
            
            if (!document.getElementById("dropdown-menu").classList.contains("show")) {
                document.getElementById("dropdown-menu").classList.toggle("show");
            }
            if (!graphData.nodes.some((node => node.id === this.value))) {
                node
                .attr("r", 6)
                .attr("stroke-opacity", 1)
                .attr("fill", d => {
                    if (d.group == "new") {
                        return "#2effbd"; 
                    } else if (d.group == "updated") {
                        return "#ff5100"
                    }
                    return "#b36bff";
                })
            }
        })
        .on("click", function(e) {
            if (editMode) {
                window.alert("Please add an edge before searching for nodes!");
                document.getElementById("node-search").value = "";
                return;
            }
            dropdownMenu.classList.toggle("show");  
            d3.selectAll("a.node-dropdown")
                .on("click", function(e) {
                    var nodeID = d3.select(this).attr("id").replace("node-", "").split("_").join(" ");
                    document.getElementById("node-search").value = nodeID;
                    dropdownMenu.classList.toggle("show");
                    node.attr("fill", (d) => {
                        if (list_attr.includes(switchSearchVal)) {
                            let node_arr = d[switchSearchVal];
                            if (node_arr.includes(nodeID)) {
                                return "rgba(179, 107, 255, 1)";
                            } else if (d.group == "new") {
                                return "rgba(0, 0, 0, 0.4)";
                            } else if (d.group == "updated") {
                                return "rgba(0, 0, 0, 0.4)";
                            }
                            return "rgba(0, 0, 0, 0.4)";
                        } else {
                            if (d[switchSearchVal] === nodeID) {
                                return "rgba(179, 107, 255, 1)"; 
                            } else if (d.group == "new") {
                                return "rgba(0, 0, 0, 0.4)";
                            } else if (d.group == "updated") {
                                return "rgba(0, 0, 0, 0.4)";
                            }
                            return "rgba(0, 0, 0, 0.4)";
                        }
                    })
                    .attr("r", (d) => {
                        if (list_attr.includes(switchSearchVal)) {
                            let node_arr = d[switchSearchVal];
                            if (node_arr.includes(nodeID)) {
                                return 10;
                            }
                            return 6;
                        } else {
                            if (d[switchSearchVal] === nodeID) {
                                return 10; 
                            }
                            return 6;
                        }
                    })
                    .attr("stroke-opacity", 0.5);
                })
        })

    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    }

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.5).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
    }
}

function radialGraph(graphObj) {
    displayGraphStatistics(graphObj);
    d3.select("#graphviz svg").remove();
    document.getElementById("dropdown-menu").replaceChildren();
    document.getElementById("comp-toggle").checked = false;
    var editMode = false;
    var graphData = graphObj.graph; 
    let connectedComp = graphObj.findLargestConnectedComponent();
    let data = graphObj.convertHierarchialData();

    let diameter = 880,
    radius = diameter / 2,
    innerRadius = radius - 100;

    let cluster = d3.cluster()
    .size([360, innerRadius]);

    var svg = d3.select("#graphviz").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

    let link = svg.append("g").selectAll(".link"),
    node = svg.append("g").selectAll(".node");


    let root = packageHierarchy(data)
        .sum(function(d) { return d.duration; });

    cluster(root);


    function lineConstructor () {
        let manipulator = 1.5+(Math.random()*0.2)
        return d3.lineRadial()
                .curve(d3.curveBundle.beta(manipulator))
                .radius(function(d) { return d.y; })
                .angle(function(d) { return d.x / 180 * Math.PI; });
      
      } 
      
        link = link
          .data(packageImports(root.leaves()))
          .enter().append("path")
            .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
            .attr("class", "link")
            .attr("stroke", (d) => {
                if (d.source.data.group == "updated" && d.target.data.group == "updated") {
                    return "#ff5100"
                }
                return "#b5b5b5"
            })
            .attr("stroke-opacity", 0.4)
            .each(function(d,i){
              d3.select(this)
              .attr("d", lineConstructor());
            })


    node = node
        .data(root.leaves())
        .enter().append("text")
        .attr("class", "node")
        .attr("dy", "0.31em")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .text(function(d) { return d.data.key; })
        .attr("fill", (d) => {
            if (d.data.group == "new") {
                return "#2effbd"; 
            } else if (d.data.group == "updated") {
                return "#ff5100"
            }
            return "#b36bff"
        })
        .attr("id", d => d.data.key)
        

        node.on("mouseover", (f, d) => {
            const movieName = document.getElementById("movieName");
            const moviePoster = document.getElementById("moviePoster");
            const movieRank = document.getElementById("movieRank");
            const releaseYear = document.getElementById("releaseYear");
            const imdbRating = document.getElementById("imdbRating");
            const durationTime = document.getElementById("durationTime");
            const genre = document.getElementById("genre");
            const directorName = document.getElementById("directorName");
            const movieID = document.getElementById("movieID");
            movieName.textContent = d.data.name;
            moviePoster.style.visibility = "true";
            moviePoster.src = d.data.img_link;
            movieRank.textContent = d.data.rank;
            releaseYear.textContent = d.data.year;
            imdbRating.textContent = d.data.imdb_rating;
            durationTime.textContent = d.data.duration;
            genre.textContent = d.data.genre.join(", ");
            directorName.textContent = d.data.director_name.join(", ");
            movieID.textContent = d.data.node_id;
            node.attr("r")
        })
        .on("mouseout", (f, d) => {
            const movieName = document.getElementById("movieName");
            const moviePoster = document.getElementById("moviePoster");
            const movieRank = document.getElementById("movieRank");
            const releaseYear = document.getElementById("releaseYear");
            const imdbRating = document.getElementById("imdbRating");
            const durationTime = document.getElementById("durationTime");
            const genre = document.getElementById("genre");
            const directorName = document.getElementById("directorName");
            const movieID = document.getElementById("movieID");
            movieName.textContent = "Hover Over Node";
            moviePoster.style.visibility = "false";
            moviePoster.src = "";
            movieRank.textContent = "Hover Over Node";
            releaseYear.textContent = "Hover Over Node";
            imdbRating.textContent = "Hover Over Node";
            durationTime.textContent = "Hover Over Node";
            genre.textContent = "Hover Over Node";
            directorName.textContent = "Hover Over Node";
            movieID.textContent = "Hover Over Node";
        })

        node.on("click", (e1, d1) => {
            editMode = true;
            const selectedNode = document.getElementById(d1.data.key);
            selectedNode.style.fill = "#b36bff";
            node.attr("fill", "#fff") 
                .on("mouseover", (f, d_mid) => {
                    const hoverNode = document.getElementById(d_mid.data.key);
                    if (d_mid.data.key != d1.data.key) {
                        hoverNode.style.fill = "#000";
                    } 
                    if (d1.data.imports.includes(d_mid.data.key)) {
                        hoverNode.style.fill = "#fa2d2d"
                    }
                })
                .on("mouseout", (f, d_mid) => {
                    const hoverNode = document.getElementById(d_mid.data.key);
                    if (d_mid.data.key != d1.data.key) {
                        hoverNode.style.fill = "#fff";
                    }
                })
                link
                .attr("stroke-opacity", (d) => {
                    if (d.source.data.key === d1.data.key || d.target.data.key === d1.data.key) {
                        return "0.4";
                    }
                    return "0";
                })
            node.on("click", (e2, d2) => {
                editMode = false;
                if (d1.data.key == d2.data.key) {
                    window.alert("Self-loops not supported in current version!")
                } else if (
                    (graphData.edges.find(n => n.source == d1.data.key && n.target == d2.data.key)) || 
                    (graphData.edges.find(n => n.source == d2.data.key && n.target == d1.data.key))) {
                        window.alert("Edge already exists!")
                } else {
                    const newEdge = {
                        source: d1.data.key,
                        target: d2.data.key
                    }
                    graphData.edges.push(newEdge);
                    for (let i in graphData.nodeDegrees) {
                        if (i == d1.data.key || i == d2.data.key) {
                            graphData.nodeDegrees[i] += 1;
                        }
                    }
                    for (let i in graphData.nodes) {
                        if (graphData.nodes[i].group == "updated") {
                            graphData.nodes[i].group = "";
                        }
                        if (graphData.nodes[i].id == d1.data.key || graphData.nodes[i].id == d2.data.key) {
                            graphData.nodes[i].group = "updated";
                        }
                    }
    
                }
                radialGraph(graphObj);
            })
        });

        node.on("contextmenu", (e, d) => {
            e.preventDefault();
            var position = d3.pointer(e);
            console.log(e);
            var con_menu = d3.select('#context_menu_node');
            
            con_menu.style('position', 'absolute')
                .style('left', e.clientX + 10 + "px")
                .style('top', e.clientY + 10 + "px")
                .style('display', 'block');
            
            d3.selectAll("body")
            .on("click", (e1) => {
                con_menu.style('display', 'none');
            })
    
            var modify_node = d3.select("#modify_node_button");
            var delete_node = d3.select("#delete_node_button");
            var delete_edge = d3.select("#delete_edge_button");
    
            modify_node.on("click", (e) => {
                var nodeBox = document.getElementById("node-box").style
                nodeBox.backgroundColor = "black";
                var node_change = d3.select("#change_node");
                node_change.style('display', 'block');
                // ^(?:[^,]+,)*[^,]+$
                // ^(?:[A-Za-z]+(?:[ ]?[A-Za-z-]+)?, ?)*(?:[A-Za-z]+(?:[ ]?[A-Za-z-]+)?)$
                var re = new RegExp("^(?:[^,]+,)*[^,]+$")
                var name_field = document.getElementById("mod_movName");
                var rank_field = document.getElementById("mod_movRank");
                var id_field = document.getElementById("mod_id");
                var cast_field = document.getElementById("mod_cast");
                var writer_field = document.getElementById("mod_writer");
                var genre_field = document.getElementById("mod_genre");
                var dir_field = document.getElementById("mod_dir");
                
                movieName.textContent = name_field.value = d.data.name;
                moviePoster.style.visibility = "true";
                moviePoster.src = d.data.img_link;
                movieRank.textContent = rank_field.value = d.data.rank;
                releaseYear.textContent = d.data.year;
                imdbRating.textContent = d.data.imdb_rating;
                durationTime.textContent = d.data.duration;
                genre.textContent = genre_field.value = d.data.genre.join(", ");
                directorName.textContent = dir_field.value = d.data.director_name.join(", ");
                movieID.textContent = id_field.value = d.data.node_id;
                cast_field.value = d.data.cast_name.join(", ");
                writer_field.value = d.data.writter_name.join(", ");
                
                var valid_input = true;
    
                name_field.addEventListener("keyup", function(eq) {
                    movieName.textContent = eq.target.value; 
                })
                rank_field.addEventListener("keyup", function(ew) {
                    movieRank.textContent = ew.target.value; 
                })
                id_field.addEventListener("keyup", function(er) {
                    movieID.textContent = er.target.value; 
                })
                cast_field.addEventListener("keyup", function(et) {
                    if (re.test(et.target.value)) {
                        cast_field.style.color = "black";
                    } else {
                        cast_field.style.color = "red";
                    } 
                })
                writer_field.addEventListener("keyup", function(ey) {
                    if (re.test(ey.target.value)) {
                        writer_field.style.color = "black";
                    } else {
                        writer_field.style.color = "red";
                    } 
                })
                genre_field.addEventListener("keyup", function(ez) {
                    genre.textContent = ez.target.value;
                    if (re.test(ez.target.value)) {
                        genre_field.style.color = "black";
                    } else {
                        genre_field.style.color = "red";
                    }
                })
                dir_field.addEventListener("keyup", function(ex) {
                    dir_field.textContent = ex.target.value;
                    if (re.test(ex.target.value)) {
                        dir_field.style.color = "black";
                    } else {
                        dir_field.style.color = "red";
                    }
                })
                d3.select("#close-con")
                    .on("click", (e) => {
                        if (re.test(genre_field.value) & re.test(dir_field.value) & re.test(cast_field.value) & re.test(writer_field.value)) {
                            valid_input = true;
                        } else {
                            valid_input = false;
                        }
                        if (valid_input) {
                            for (let i = 0; i < graphData.nodes.length; i++) {
                                if (graphData.nodes[i].id == d.data.node_id) {
                                    var node_changed = graphData.nodes[i];
                                    var id_change = graphData.nodes[i].id;
                                    node_changed.name = name_field.value;
                                    node_changed.rank = rank_field.value;
                                    node_changed.id = id_field.value;
                                    node_changed.genre = genre_field.value.split(", ");
                                    node_changed.director_name = dir_field.value.split(", ");
                                    node_changed.cast_name = cast_field.value.split(", ");
                                    node_changed.writter_name = writer_field.value.split(", ");
                                    node_changed.group = "updated";
                                    if (id_field.value != id_change) {
                                        for (let j = 0; j < graphData.edges.length; j++) {
                                            if (graphData.edges[j].source == id_change) {
                                                graphData.edges[j].source = id_field.value
                                            } else if (graphData.edges[j].target == id_change) {
                                                graphData.edges[j].target = id_field.value
                                            }
                                        }
                                        let deg_change = Object.keys(graphData.nodeDegrees);
                                        for (let j = 0; j < deg_change.length; j++) {
                                            if (deg_change == id_change) {
                                                var deg = graphData.nodeDegrees[id_change];
                                                delete graphData.nodeDegrees[id_change];
                                                graphData.nodeDegrees[id_field.value] = deg;
                                            }
                                        }
                                        radialGraph(graphObj);
                                    }
                                }
                            }
                            node_change.style('display', 'none');
                            nodeBox.backgroundColor = "#25252559";
                            radialGraph(graphObj);
                        }
                        else {
                            window.alert("One of your inputs is invalid. Please correct it before closing this window!")
                        }
                        
                    })
                
            })
            delete_node.on("click", (e) => {
                var winConf = window.confirm("Are you sure you want to delete this node?")
                if (winConf) {
                    for (let i = 0; i < graphData.nodes.length; i++) {
                        if (graphData.nodes[i].id == d.data.node_id) {
                            graphData.nodes.splice(i, 1);
                        }
                    }
                    for (let i = 0; i < graphData.edges.length; i++) {
                        if (graphData.edges[i].source == d.data.node_id || graphData.edges[i].target == d.data.node_id) {
                            graphData.edges.splice(i, 1);
                        }
                    }
                }
                radialGraph(graphObj);
            })
    
            delete_edge.on("click", (e) => {
                var edge_nodes = [];
                for (let i = 0; i < graphData.edges.length; i++) {
                    if (graphData.edges[i].source == d.data.node_id) {
                        edge_nodes.push(graphData.edges[i].target);
                    } else if (graphData.edges[i].target == d.data.node_id) {
                        edge_nodes.push(graphData.edges[i].source);
                    }
                }
                node.attr("fill", (d1) => {
                    if (d1.data.node_id == d.data.node_id) {
                        return "rgba(0, 0, 0, 1)";
                    } 
                    if (edge_nodes.includes(d1.data.node_id)) {
                        return "rgba(179, 107, 255, 1)";
                    }
                    return "rgba(179, 107, 255, 0.3)";
                })
                .attr("r", (d1) => {
                    if (d1.data.node_id == d.data.node_id) {
                        return "7.1";
                    } 
                    if (edge_nodes.includes(d1.data.node_id)) {
                        return "7.1";
                    }
                    return "3";
                })
                .attr("stroke-opacity", (d1) => {
                    if (d1.data.node_id == d.data.node_id) {
                        return "1.6";
                    } 
                    if (edge_nodes.includes(d1.data.node_id)) {
                        return "1.6";
                    }
                    return "0.6";
                })
                link.attr("stroke-opacity", (d1) => {
                    if ((d.data.node_id == d1.source.data.node_id && edge_nodes.includes(d1.target.data.node_id)) || (d.data.node_id == d1.target.data.node_id && edge_nodes.includes(d1.source.data.node_id))) {
                        return "0.6"
                    }
                    return "0";
                })
    
                node.on("click", (e, d1) => {
                    if (edge_nodes.includes(d1.data.node_id)) {
                        var edgeConf = window.confirm("Are you sure you want to delete this edge?")
                        if (edgeConf) {
                            for (let i = 0; i < graphData.edges.length; i++) {
                                if ((d1.data.node_id == graphData.edges[i].source || d1.data.node_id == graphData.edges[i].target) && (d.data.node_id == graphData.edges[i].source || d.data.node_id == graphData.edges[i].target)) {
                                    graphData.edges.splice(i, 1);
                                }
                            }
                            for (let i = 0; i < graphData.nodes.length; i++) {
                                if (graphData.nodes[i].id == d1.data.node_id || graphData.nodes[i].id == d.data.node_id) {
                                    graphData.nodes[i].group = "updated";
                                }
                            }
                        }
                    } else {
                        window.alert("Edge does not exist!");
                        node.attr("stroke", "#fff")
                            .attr("stroke-opacity", "1")
                            .attr("stroke-width", 1.5)
                            .attr("r", 6)
                            .attr("fill", d => {
                                if (d.data.group == "new") {
                                    return "#2effbd"; 
                                } else if (d.data.group == "updated") {
                                    return "#ff5100"
                                } 
                                return "#b36bff";
                            })
                            link.attr("stroke-opacity", 0.6);
                    }
                    radialGraph(graphObj);
                })
            })
        })

        var switchSearchVal = "id";
        var list_attr = ["genre", "cast_name", "director_name", "writter_name"];
        const switchSearch = d3.select("#switchSearch")
        .on("change", function (e) {
            var searchText = document.getElementById("searchText");
            if (e.target.value == 7) {
                e.target.value = 0;
            }
            if (e.target.value == -1) {
                e.target.value = 6;
            }
            if (e.target.value == 0) {
                searchText.innerText = "ID";
                switchSearchVal = "id";
            }
            else if (e.target.value == 1) {
                searchText.textContent = "Rank";
                switchSearchVal = "rank";
            }
            else if (e.target.value == 2) {
                searchText.innerText = "Name";
                switchSearchVal = "name";
            }
            else if (e.target.value == 3) {
                searchText.innerText = "Genre";
                switchSearchVal = "genre";
            }
            else if (e.target.value == 4) {
                searchText.innerText = "Cast Name";
                switchSearchVal = "cast_name";
            }
            else if (e.target.value == 5) {
                searchText.innerText = "Director Name";
                switchSearchVal = "director_name";
            }
            else if (e.target.value == 6) {
                searchText.innerText = "Writer Name";
                switchSearchVal = "writter_name";
            }
            var elements = new Set();
            if (list_attr.includes(switchSearchVal)) {
                for (let i = 0; i < graphData.nodes.length; i++) {
                    for (var j = 0; j < graphData.nodes[i][switchSearchVal].length; j++) {
                        elements.add(graphData.nodes[i][switchSearchVal][j])
                    }
                }      
            } else {
                for (let i = 0; i < graphData.nodes.length; i++) {
                    elements.add(graphData.nodes[i][switchSearchVal])
                }
            }
            let dropdownMenu = document.getElementById("dropdown-menu");
            dropdownMenu.innerHTML = '';
            if (!dropdownMenu.children.length >= 1) {
                for (let i = 0; i < elements.size; i++) {
                    var value = Array.from(elements)[i];
                    var idValue = value.split(" ").join("_");
                    var nodeDropDown = document.createElement("a");
                    nodeDropDown.classList.add("node-dropdown")
                    nodeDropDown.setAttribute("id", "node-" + idValue);
                    nodeDropDown.textContent = value;
                    dropdownMenu.appendChild(nodeDropDown);
                }
            }
        })

        const largestCompToggle = document.getElementById("comp-toggle");
        largestCompToggle.addEventListener("change", (e) => {
            if (editMode) {
                window.alert("Please add an edge before switching layouts!")
                document.getElementById("comp-toggle").checked = false;
                return;
            }
            document.getElementById("node-search").value = "";
            if (e.target.checked) {
                node.attr("fill", (d) => {
                    let compNodes = connectedComp.nodes.map(n => n.id)
                    if (compNodes.includes(d.data.key)) {
                        return "rgba(179, 107, 255, 1)";
                    }
                    return "rgba(179, 107, 255, 0.3)"
                })
                link.attr("stroke-opacity", (d) => {
                    let compNodes = connectedComp.nodes.map(n => n.id)
                    if (compNodes.includes(d.source.data.key) || compNodes.includes(d.target.data.key)) {
                        return "0.4";
                    }
                    return "0";
                })
                .attr("stroke", "#b5b5b5")
            } else {
                node.attr("fill", d => {
                    if (d.data.group == "new") {
                        return "#2effbd"; 
                    } else if (d.data.group == "updated") {
                        return "#ff5100"
                    }
                    return "#b36bff";
                })
                .attr("r", "6")
                .attr("stroke-opacity", "1")
                link.attr("stroke-opacity", "0.4")
                .attr("stroke", (d) =>{
                    if (d.source.data.group == "updated" && d.target.data.group == "updated") {
                        return "#ff5100"
                    }
                    return "#b5b5b5"
                })
            }
        });

        const dropdownMenu = document.getElementById("dropdown-menu");
        if (!dropdownMenu.children.length >= 1) {
            for (let i = 0; i < graphData.nodes.length; i++) {
                var nodeDropDown = document.createElement("a");
                nodeDropDown.classList.add("node-dropdown")
                nodeDropDown.setAttribute("id", "node-" + graphData.nodes[i].id);
                nodeDropDown.textContent = graphData.nodes[i].id;
                dropdownMenu.appendChild(nodeDropDown);
            }
        }

        const newNodeAdd = d3.select("#add-node")
            .on("click", function(e) {
                if (document.getElementById("node-name").value == '') {
                    window.alert("Add a node name first!")
                } else if (graphData.nodes.some(node => node.id == document.getElementById("node-name").value)) {
                    window.alert("This node already exists!")
                } else {
                    const newNode = {
                        id: document.getElementById("node-name").value,
                        group: "new"
                        };
                    graphData.nodeDegrees[document.getElementById("node-name").value] = 0;
                    document.getElementById("node-name").value = "";
                    graphData.nodes.push(newNode);
                    radialGraph(graphObj);
                }
            })

        d3.select("#node-search")
            .on("keyup", function(e) {
                if (editMode) {
                    window.alert("Please add an edge before searching for nodes!");
                    document.getElementById("node-search").value = "";
                    dropdownMenu.classList.toggle("show"); 
                    return;
                }
                if (document.getElementById("comp-toggle").checked == true) {
                    document.getElementById("comp-toggle").checked = false;
                    node.attr("fill", d => {
                        if (d.data.group == "new") {
                            return "#2effbd"; 
                        } else if (d.data.group == "updated") {
                            return "#ff5100"
                        }
                        return "#b36bff";
                    })
                    .attr("r", "6")
                    .attr("stroke-opacity", "1")
                    link.attr("stroke-opacity", "0.4")
                }
                if (!document.getElementById("dropdown-menu").classList.contains("show")) {
                    document.getElementById("dropdown-menu").classList.toggle("show");
                }
                if (!graphData.nodes.some((node => node.id === this.value))) {
                    node
                    .attr("stroke-opacity", "1")
                    .attr("fill", d => {
                        if (d.data.group == "new") {
                            return "#2effbd"; 
                        } else if (d.data.group == "updated") {
                            return "#ff5100"
                        }
                        return "#b36bff";
                    });
                    link
                    .attr("stroke-opacity", 0.4);
                }
            })
            .on("click", function(e) {
                if (editMode) {
                    window.alert("Please add an edge before searching for nodes!");
                    document.getElementById("node-search").value = "";
                    return;
                }
                dropdownMenu.classList.toggle("show");  
                d3.selectAll("a.node-dropdown")
                    .on("click", function(e) {
                        var nodeID = d3.select(this).attr("id").replace("node-", "").split("_").join(" ");
                        document.getElementById("node-search").value = nodeID;
                        dropdownMenu.classList.toggle("show");
                        node.attr("fill", (d) => {
                            var id_val;
                            if (switchSearchVal == "id") {
                                id_val = "node_id";
                            } else {
                                id_val = switchSearchVal;
                            }
                            if (list_attr.includes(id_val)) {
                                let node_arr = d.data[id_val];
                                if (node_arr.includes(nodeID)) {
                                    return "rgba(179, 107, 255, 1)";
                                } else if (d.data.group == "new") {
                                    return "rgba(0, 0, 0, 0.4)";
                                } else if (d.data.group == "updated") {
                                    return "rgba(0, 0, 0, 0.4)";
                                }
                                return "rgba(0, 0, 0, 0.4)";
                            } else {
                                if (d.data[id_val] === nodeID) {
                                    return "rgba(179, 107, 255, 1)"; 
                                } else if (d.data.group == "new") {
                                    return "rgba(0, 0, 0, 0.4)";
                                } else if (d.data.group == "updated") {
                                    return "rgba(0, 0, 0, 0.4)";
                                }
                                return "rgba(0, 0, 0, 0.4)";
                            }
                        })
                        .attr("r", (d) => {
                            if (list_attr.includes(id_val)) {
                                let node_arr = d.data[id_val];
                                if (node_arr.includes(nodeID)) {
                                    return 10;
                                }
                                return 6;
                            } else {
                                if (d.data[id_val] === nodeID) {
                                    return 10; 
                                }
                                return 6;
                            }
                        })
                        .attr("stroke-opacity", 0.5);
                        
                        // link.attr("stroke-opacity", "0");

                    })
            })



function packageHierarchy(classes) {
    var map = {};
  
    function find(id, data) {
      var node = map[id], i;
      if (!node) {
        node = map[id] = data || {id: id, children: []};
        if (id.length) {
          node.parent = find(id.substring(0, i = id.lastIndexOf(".")));
          node.parent.children.push(node);
          node.key = id.substring(i + 1);
        }
      }
      return node;
    }
  
    classes.forEach(function(d) {
      find(d.node_id, d);
    });
  
    return d3.hierarchy(map[""]);
  }
  
  // Return a list of imports for the given array of nodes.
  function packageImports(nodes) {
    var map = {},
        imports = [];
  
    // Compute a map from name to node.
    nodes.forEach(function(d) {
      map[d.data.node_id] = d;
    });
  
    // For each import, construct a link from the source to target node.
    nodes.forEach(function(d) {
      if (d.data.imports) d.data.imports.forEach(function(i) {
        imports.push(map[d.data.node_id].path(map[i]));
      });
    });
  
    return imports;
  }
}

/*
    Function to fetch the JSON data from output_graph.json & call the renderGraph() method
    to visualize this data
*/
function loadGraph(fileName) {
    fetch(fileName)
    .then(response => response.json())
    .then(data => {
        fetch('movie-img_links.json')
        .then(response => response.json())
        .then(newData => {
            renderGraph(data, newData);
        })
        .catch(error => console.error('There was an error!', error));
    })
    .catch(error => console.error('There was an error!', error));
}

/*
    A method to compute simple statistics (Programming part Subproblem 6)
    on updated graph data
*/
function displayGraphStatistics(graphObj) {
    let avgDegElement = document.getElementById("avgDegree");
    avgDegElement.textContent = graphObj.computeAverageNodeDegree().toString();

    let numComponentsElement = document.getElementById("numComponents");
    numComponentsElement.textContent = graphObj.computeConnectedComponents().toString();

    let graphDensityElement = document.getElementById("graphDensity");
    graphDensityElement.textContent = graphObj.computeGraphDensity().toString();

    let graphDiameterElement = document.getElementById("graphDiameter");
    graphDiameterElement.textContent = graphObj.findGraphDiameter().toString();

    let aplElement = document.getElementById("apl");
    aplElement.textContent = graphObj.computeAPL().toString();
}

// instantiate an object of GraphClass


// your saved graph file from Homework 1
let fileName="output_graph.json"

// render the graph in the browser
loadGraph(fileName);

// compute and display simple statistics on the graph
// displayGraphStatistics(graphObj);