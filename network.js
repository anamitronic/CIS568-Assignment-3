
function simulate(data,svg)
{
    const width = parseInt(svg.attr("viewBox").split(' ')[2])
    const height = parseInt(svg.attr("viewBox").split(' ')[3])
    const main_group = svg.append("g")
        .attr("transform", `translate(0, 50)`)

   //calculate degree of the nodes:
    let node_degree={}; //initiate an object
   d3.map(data.links, function (d){
	   if (node_degree.hasOwnProperty(d.source))
	   {
		   node_degree[d.source]++
	   }
	   else {
		   node_degree[d.source]=0
	   }
	   if (node_degree.hasOwnProperty(d.target))
	   {
		   node_degree[d.target]++
	   }
	   else{
		   node_degree[d.target]=0
	   }
   })

   // Count occurrences for each affiliation
   let affiliationCounts = {};
   d3.map(data.nodes, function (d){
        let affiliation = d.Affiliation;
        if (affiliationCounts.hasOwnProperty(affiliation)) {
            affiliationCounts[affiliation]++;
        } else {
            affiliationCounts[affiliation] = 1;
        }
    })
      
   // Get top 10 countries by count
   let topCountries = Object.keys(affiliationCounts)
   	.sort((a, b) => affiliationCounts[b] - affiliationCounts[a])
   	.slice(0, 10);
   
   // Create color scale for top 10 countries
   let colorScale = d3.scaleOrdinal()
   	.domain(topCountries)
   	.range(d3.schemeCategory10);
   
   // Function to get color for a node
   let getNodeColor = function(affiliation) {
   	if (topCountries.includes(affiliation)) {
   		return colorScale(affiliation);
   	} else {
   		return "#A9A9A9";
   	}
   };

	let scale_radius = d3.scaleLinear()
		.domain(d3.extent(Object.values(node_degree)))
		.range([3,12])
		
	let link_elements = main_group.append("g")
		.attr('transform',`translate(${width/2},${height/2})`)
		.selectAll(".line")
		.data(data.links)
		.enter()
		.append("line")
		
	let treatPublishersClass=(affiliation)=>{
		let temp=affiliation.toString().split(' ').join('');
		temp = temp.split(".").join('');
		temp = temp.split(",").join('');
		temp = temp.split("/").join('');
		return "gr"+temp
	}
	
	let node_elements = main_group.append("g")
		.attr('transform', `translate(${width/2},${height/2})`)
		.selectAll(".circle")
		.data(data.nodes)
		.enter()
		.append('g')
	.attr("class", function (d){
		return treatPublishersClass(d.Affiliation)})
		.on("mouseover", function (d){
			d3.selectAll("#Paper_Title").text(d['Author Name'])
			node_elements.classed("inactive",true)
			const selected_class = d3.select(this).attr("class").split(" ")[0];
			console.log(selected_class)
			d3.selectAll("."+selected_class).classed("inactive", false)
		})
		.on("mouseout", function(d){
			d3.select("#Paper_Title").text("")
			d3.selectAll(".inactive").classed("inactive", false)
		})
		.on("click", function (event, d){
			console.log("Clicked node:", d);
			let tooltip = d3.select("#tooltip");
			let tooltipContent = `
				<strong>Author Name:</strong> ${d['Author Name']}<br>
				<strong>Affiliation:</strong> ${d.Affiliation}<br>
				<strong>Author ID:</strong> ${d.id}
			`;
			tooltip.html(tooltipContent)
				.style("display", "block")
				.style("left", (event.pageX + 10) + "px")
				.style("top", (event.pageY - 10) + "px");
		})
		.on("mousemove", function(d){
			d3.select("#tooltip").style("display", "none");
		})
	
	node_elements.append("circle")
		.attr("r", function(d,i) {
			
			if(node_degree[d.id]!=undefined){
				return scale_radius(node_degree[d.id])
			}
			else {
				return scale_radius(0)
			}
		})
		.attr("fill", function (d) {
			return getNodeColor(d.Affiliation)
		})
	
	let ForceSimulation = d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide().radius(function (d,i){
				return scale_radius(node_degree[d.id])*1.2}))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody())
        .force("link",d3.forceLink(data.links)
            .id(function (d){
				return d.id})
        )
        .on("tick", ticked);

    function ticked()
    {
    node_elements
        .attr('transform', function(d){return `translate(${d.x},${d.y})`})
        link_elements
			.attr("x1",function(d){return d.source.x})
			.attr("x2",function(d){return d.target.x})
			.attr("y1",function(d){return d.source.y})
			.attr("y2",function(d){return d.target.y})
		}

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.6, 8])
        .on("zoom", zoomed));
    function zoomed({transform}) {
        main_group.attr("transform", transform);
    }
			
}
	
    /* const scale_radius = d3.scaleLinear()
        .domain(d3.extent(Object.values(node_degree)))
        .range([5,20])
    const scale_link_stroke_width = d3.scaleLinear()
        .domain(d3.extent(data.links, d=> d.value))
        .range([1,5])

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const link_elements = main_group.append("g")
        .attr('transform',`translate(${width/2},${height/2})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("line")
        .style("stroke-width", d=> scale_link_stroke_width(d.value));
    const node_elements = main_group.append("g")
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .selectAll(".circle")
        .data(data.nodes)
        .enter()
        .append('g')
        .attr("class",function (d){return "gr_"+d.group.toString()})
        .on("mouseenter",function (d,data){
            node_elements.classed("inactive",true)
            d3.selectAll(".gr_"+data.group.toString()).classed("inactive",false)
        })
        .on("mouseleave", (d,data)=>{
            d3.selectAll(".inactive").classed("inactive",false)
        })
    node_elements.append("circle")
        .attr("r",  (d,i)=>{
            return scale_radius(node_degree[i])
        })
        .attr("fill",  d=> color(d.group))

    node_elements.append("text")
        .attr("class","label")
        .attr("text-anchor","middle")
        .text(d=>d.name)

    let ForceSimulation = d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide().radius((d,i)=>{return scale_radius(node_degree[i])*4}))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody())
        .force("link",d3.forceLink(data.links)
            .id(d=>d.index)
            .distance(d=>d.value)
            .strength(d=>d.value*.1)
        )
        .on("tick", ticked);

    function ticked()
    {
    node_elements
        .attr('transform', (d)=>`translate(${d.x},${d.y})`)
        link_elements
            .attr("x1",d=>d.source.x)
            .attr("x2",d=>d.target.x)
            .attr("y1",d=>d.source.y)
            .attr("y2",d=>d.target.y)

        }

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", zoomed));
    function zoomed({transform}) {
        main_group.attr("transform", transform);
    } 
	
	// Sample data
	const data = ['apple', 'banana', 'apple', 'orange', 'banana', 'banana'];

	// Count occurrences
	const counts = {};
	data.forEach(item => {
		counts[item] = (counts[item] || 0) + 1;
	});

	// Create a color scale
	const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

	// Generate colors for each unique item
	const uniqueItems = Object.keys(counts);
	const colors = uniqueItems.map(item => colorScale(item));

	// Output the results
	const result = uniqueItems.map((item, index) => ({
		item: item,
		count: counts[item],
		color: colors[index]
	}));

	console.log(result);

	*/