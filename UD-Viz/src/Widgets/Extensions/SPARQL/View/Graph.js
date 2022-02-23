import * as d3 from 'd3';
import { SparqlQueryWindow } from './SparqlQueryWindow';

export class Graph {
  /**
   * Create a new D3 graph from an RDF JSON object.
   * Adapted from https://observablehq.com/@d3/force-directed-graph#chart and
   * https://www.d3indepth.com/zoom-and-pan/
   *
   * @param {SparqlQueryWindow} window the window this graph is attached to.
   * @param {Number} height The SVG height.
   * @param {Number} height The SVG width.
   */
  constructor(window, height = 500, width = 500) {
    this.window = window;
    this.height = height;
    this.width = width;
    

    this.svg = d3
      .create('svg')
      .attr('class', 'd3_graph')
      .attr('viewBox', [0, 0, this.width, this.height])
      .style('display', 'hidden');
  }

  /**
   * Create a new graph based on an graph dataset.
   *
   * @param {Object} data an RDF JSON object.
   */
  update(data) {
    this.clear();

    const links = data.links.map((d) => Object.create(d));
    const nodes = data.nodes.map((d) => Object.create(d));
    const namespaces = data.legend;

    
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3.forceLink(links).id((d) => d.id)
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(this.width / 2, this.height / 4));

    const zoom = d3.zoom().on('zoom', this.handleZoom);

    this.svg.call(zoom)
    

    const link = this.svg
      .append('g')
      //.attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(d.value))
      .attr("stroke",function (d) { 
        if(d.label.includes("prefLabel"))
        return 'rgb(13, 94, 8)'
        else if(d.label.includes("consistsOfBuildingPart"))
        return 'rgb(166, 236, 8)'
        else if(d.label.includes("creationDate"))
        return 'red'
        else if(d.label.includes("coordinateDimension"))
        return 'rgb(151, 107, 0)'
        else if(d.label.includes("altLabel"))
        return 'rgb(151, 0, 185)'
        else if(d.label.includes("cityObjectMember"))
        return 'rgb(82, 235, 8)'
        else return 'rgb(151, 107, 185)'
       })

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const node = this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      //.attr('fill', (d) => colorScale(d.namespace))
      .attr('fill', function (d) { 
        if(d.id.includes("2017"))
        return "black";
        else if(d.id.includes("inconnu"))
        return "black";
        else if(d.id.includes("EPSG"))
        return "black";
        else return colorScale(d.namespace);
       })
      .on('click', (d) =>
        this.window.sendEvent(SparqlQueryWindow.EVENT_NODE_SELECTED, d.path[0].textContent)
      )
      .call(this.drag(simulation));

    node.append('title').text((d) => d.id);
    // Test sur les noeuds v
    
    var label = this.svg.selectAll(".mytext")
                        .data(nodes)
                        .enter()
                        .append("text")
                        .text(function (d) { 
                          if(d.id.includes("#") && d.namespace==1)
                          //return d.id.split("#")[1];
                          return '';
                          else if(d.id.includes("#"))
                          return d.id.split("#")[1];
                          else return d.id;
                         })
                        .style("text-anchor", "middle")
                        .style("fill", "#555")
                        .style("font-family", "Arial")
                        .style("font-size", 10)
                        //.style("font-weight", 'bold')
                        .attr("class","myclass")
                        .call(this.drag(simulation))
                        .on('click', (d) =>
                          this.window.sendEvent(SparqlQueryWindow.EVENT_NODE_SELECTED, d.path[0].textContent)
                        )
    // *****************************************
    // var linkText = this.svg.selectAll(".mylink")
    //                     .data(links)
    //                     .enter()
    //                     .append("text")
    //                     .text(function (d) { 
    //                       if(d.label.includes("#"))
    //                       return d.label.split("#")[1]
    //                       //else return 'Object member'
    //                      })
    //                     .style("text-anchor", "middle")
    //                     .style("fill", "#555")
                        
    //                     .style("font-family", "Arial")
    //                     .style("font-size", 10)
    //                     .attr("class","myclass")
    //                     .call(this.drag(simulation))
    //******************************************/
    simulation.on('tick', () => {
      label
        .attr("x", function(d){ return d.x; })
        .attr("y", function (d) {return d.y - 10; });
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      // linkText
      //   .attr("x", function(d) {
      //       return ((d.source.x + d.target.x)/2);
      //   })
      //   .attr("y", function(d) {
      //       return ((d.source.y + d.target.y)/2);
      //   });
      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    });

    // Create legend
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', (d, i) => 10 + i * 16)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', (d, i) => colorScale(i))
      .append('title')
      .text((d) => d);
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 42)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'black')
      .append('title')
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 58)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'rgb(31, 119, 180)')
      .append('title')
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 74)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'rgb(166, 236, 8)')
      .append('title')
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 90)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'red')
      .append('title')
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 106)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'rgb(151, 107, 0)')
      .append('title')
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 122)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'rgb(151, 0, 185)')
      .append('title')
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 138)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'rgb(82, 235, 8)')
      .append('title')
    this.svg
      .append('g')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .selectAll('rect')
      .data(namespaces)
      .join('rect')
      .attr('x', 10)
      .attr('y', 154)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', 'rgb(13, 94, 8)')
      .append('title')

    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', (d, i) => 20 + i * 16)
      .text((d) => d);
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 52)
      .text('Common data');
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 68)
      .text('Unique Building data');
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 84)
      .text('consistsOfBuildingPart');
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 100)
      .text('creationDate');
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 116)
      .text('coordinateDimension');
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 132)
      .text('altLabel');
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 148)
      .text('cityObjectMember');
    this.svg
      .append('g')
      .selectAll('text')
      .data(namespaces)
      .join('text')
      .attr('x', 24)
      .attr('y', 164)
      .text('prefLabel');
  }

  /**
   * Hide the graph SVG
   */
  hide() {
    this.svg.style('display', 'hidden');
  }

  /**
   * Show the SVG graph
   */
  show() {
    this.svg.style('display', 'visible');
  }

  /**
   * Remove nodes and lines from the SVG.
   */
  clear() {
    this.svg.selectAll('g').remove();
  }

  /**
   * Create a drag effect for graph nodes within the context of a force simulation
   * @param {d3.forceSimulation} simulation
   * @returns {d3.drag}
   */
  drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  /**
   * A handler function for selecting elements to transform during a zoom event
   * @param {d3.D3ZoomEvent} event
   */
  handleZoom(event) {
    d3.selectAll('svg g')
      .filter((d, i) => i < 2)
      //.attr('transform', event.transform)
      .attr("height","100%")
      .attr("width","100%")
      .attr("transform",
      "translate(" + event.transform.x + "," + event.transform.y + ") scale(" + event.transform.k + ")")
        window.console && console.log("here", event.transform.x,event.transform.k,event);
      d3.selectAll("text.myclass").style("font-size", (10/event.transform.k) + "px")
      .attr("transform",
      "translate(" + event.transform.x + "," + event.transform.y + ") scale(" + event.transform.k + ")")
        window.console && console.log("here", event.transform.x,event.transform.k,event);
  }

  /**
   * Getter for retrieving the d3 svg.
   */
  get data() {
    return this.svg.node();
  }
}
