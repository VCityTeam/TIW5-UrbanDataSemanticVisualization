import * as d3 from 'd3';
import { SparqlQueryWindow } from './SparqlQueryWindow';

export class JsonView {
  /**
     * Create a new D3 graph from an RDF JSON object.
     * Adapted from https://observablehq.com/@d3/force-directed-graph#chart and
     * https://www.d3indepth.com/zoom-and-pan/
     *
     * @param {SparqlQueryWindow} window the window this graph is attached to.
     * @param {Number} height The SVG height.
     * @param {Number} height The SVG width.
     */
  constructor(window, height = 1000, width = 500) {
    this.window = window;
    this.height = height;
    this.width = width;

    this.svg = d3
      .create('svg')
      .attr('class', 'jsonView')
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
    this.svg.append('tr')
        .attr('class','head')
        .selectAll('th')
        .data(data)
        .enter()
        .append('th')
        .html((d)=> {
          return d;
        });
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
      .attr('transform', event.transform);
  }

  /**
     * Getter for retrieving the d3 svg.
     */
  get data() {
    return this.svg.node();
  }
}
