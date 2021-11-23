//import * as d3 from 'd3';
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
  constructor(window, height = 500, width = 500) {
    this.window = window;
    this.height = height;
    this.width = width;
 
  }

  /**
   * Create a new graph based on an graph dataset.
   *
   * @param {String} data JSON object.
   */
  update(data) {
    this.clear();
    fetch(data)
    .then(function(response){
      return response.json;

    })
    .then(function(data){
      

    })
    .catch(function(err){
      console.log(err);
    })
  
     
  }

  appendData(data) {
    var  canvas= document.getElementById("myCanvas");
    canvas.textContent=JSON.stringify(data, undefined, 2);
  }

  canvasHtml(data){
    var canv=document.createElement("canvas")
  }

  
}
