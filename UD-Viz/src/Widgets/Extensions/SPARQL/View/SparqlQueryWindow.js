import { Window } from '../../../Components/GUI/js/Window';
import { SparqlEndpointResponseProvider } from '../ViewModel/SparqlEndpointResponseProvider';
import { Graph } from './Graph';
import { LayerManager } from '../../../Components/Components';
import { ExtendedCityObjectProvider } from '../ViewModel/ExtendedCityObjectProvider';
import './SparqlQueryWindow.css';
import { JsonView } from './JsonView';
import * as d3 from 'd3';

/**
 * The SPARQL query window class which provides the user interface for querying
 * a SPARQL endpoint and displaying the endpoint response.
 */
export class SparqlQueryWindow extends Window {
  /**
   * Creates a SPARQL query window.
   * @param {SparqlEndpointResponseProvider} sparqlProvider The SPARQL Endpoint Response Provider
   * @param {ExtendedCityObjectProvider} cityObjectProvider The City Object Provider
   * @param {LayerManager} layerManager The UD-Viz LayerManager.
   * 
   */
 
  constructor(sparqlProvider, cityObjectProvider, layerManager) {
    super('sparqlQueryWindow', 'SPARQL Query');

    /**
     * The SPARQL Endpoint Response Provider
     *
     * @type {SparqlEndpointResponseProvider}
     */
    this.sparqlProvider = sparqlProvider;

    /**
     * The Extended City Object Provider
     *
     * @type {ExtendedCityObjectProvider}
     */
    this.cityObjectProvider = cityObjectProvider;

    /**
     * The UD-Viz LayerManager.
     *
     * @type {LayerManager}
     */
    this.layerManager = layerManager;

    /**
     * Contains the D3 graph view to display RDF data.
     *
     * @type {Graph}
     */
    this.graph = new Graph(this);



    /**
     * Contains the D3 Json View
     *
     * @type {Graph}
     */
    this.jsonView=new JsonView(this);

    /**
     * The initial SPARQL query to display upon window initialization.
     *
     * @type {Graph}
     */
    this.default_query = `PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
PREFIX gmlowl:  <http://www.opengis.net/ont/gml#>
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX strdf: <http://strdf.di.uoa.gr/ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX core: <http://www.opengis.net/citygml/2.0/core#>
PREFIX bldg: <http://www.opengis.net/citygml/building/2.0/building#>

# Return all CityGML City Objects
SELECT *
WHERE {
  ?subject a core:CityModel ;
    ?predicate ?object .
  ?subject a ?subjectType .
  ?object a bldg:Building .
  ?object a ?objectType .
  
  FILTER(?subjectType != <http://www.w3.org/2002/07/owl#NamedIndividual>)
  FILTER(?objectType != <http://www.w3.org/2002/07/owl#NamedIndividual>)
}`;
    this.registerEvent(SparqlQueryWindow.EVENT_NODE_SELECTED);
  }

  /**
   * Override the windowCreated function. Sets the SparqlEndpointResponseProvider
   * and graph view. Should be called by `SparqlModuleView`. Once this is done,
   * the window is actually usable ; service event listerers are set here.
   * @param {SparqlEndpointService} service The SPARQL endpoint service.
   */
  windowCreated() 
  {
    this.form.onsubmit = () => {
      this.sparqlProvider.querySparqlEndpointService(this.queryTextArea.value);
      return false;
    };
  
    this.sparqlProvider.addEventListener(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED,
      (data) => this.updateDataView(data, document.getElementById(this.resultSelectId).value)
    );

  }

  /**
   * Transform js array to html table using d3 library
   *
   * @param {Object[]} data
   * @param {string[]} columns
   * @returns
   */
  dataAsTable(data, columns) {
    var table = d3.select('body').append('table');
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    // append the header row
    thead.append('tr')
      .selectAll('th')
      .data(columns).enter()
      .append('th')
      .text(function (column) { return column; });

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
      .data(data)
      .enter()
      .append('tr');

    // create a cell in each row for each column
    var cells = rows.selectAll('td')
      .data(function (row) {
        return columns.map(function (column) {
          return {column: column, value: row[column]};
        });
      })
      .enter()
      .append('td')
      .text(function (d) { return d.value; });

    return table;
  }

  /**
   * Update the window.
   * @param {Object} data SPARQL query response data.
   * @param {Object} viewType The selected semantic data view type.
   */
  updateDataView(data, viewType) {
    switch(viewType){
      case 'graph':
        // this.hideJsonWindow();
        // this.showGraphWindow();
        this.dataView.innerHTML='';
        this.graph.update(data);
        this.dataView.style['visibility'] = 'visible';
        this.dataView.append(this.graph.data);
        var  jsonData=JSON.stringify(data, undefined, 2);
        break;
      case 'json':
        // this.hideGraphWindow();
        // this.showJsonWindow();
        var  json=JSON.stringify(data, undefined, 2);
        this.dataView.style['visibility'] = 'visible';
        this.dataView.innerHTML='';
        this.dataView.append(jsonData);
        // console.log(jsonData);
        break;
      case 'table':
        this.dataView.innerHTML='';
        //  var jsonData=JSON.stringify(data,undefined, 2);
        this.dataView.style['visibility'] = 'visible';
        let result = this.dataAsTable(data.nodes, ['id', 'namespace']);
        this.dataView.append(result._parents[0].getElementsByTagName('table')[0]);
        this.dataView.querySelector('table').style['border']='1px solid white';
        this.dataView.querySelector('table').style['width']='100%';
        var sheet = window.document.styleSheets[0];
        sheet.insertRule('thead { color: #90EE90; margin:auto; }', sheet.cssRules.length);

        sheet.insertRule('tr {border-style: dotted solid !important; }', sheet.cssRules.length);
        break;
      default:
        console.log('ce format est pas disponible');

    }
   
  }

  // SPARQL Window getters //
  get innerContentHtml() {
    return /*html*/ `EVENT_BUILDING_DETAILS
      <form id=${this.formId}>
        <label for="${this.queryTextAreaId}">Query:</label></br>
        <textarea id="${this.queryTextAreaId}" rows="10">${this.default_query}</textarea></br>
        <input id="${this.queryButtonId}" type="submit" value="Send"/>
      </form>
      <label>Results Format:</label>
      <select id="${this.resultSelectId}">
        <option value="graph">Graph</option>
        <option value="table">Table</option>
        <option value="json">Json</option>
        <option value="timeline">Timeline</option>
      </select>
      <div id="${this.dataViewId}"></div>
      <div id="${this.semanticDataViewId}"></div>
      <div id="${this.jsonDataViewId}"></div>
      
      `;
  }

  hideGraphWindow(){
    document.getElementById(this.dataViewId).style.display='none';
    document.getElementById(this.semanticDataViewId).style.display='none';
  }

  hideJsonWindow(){
    document.getElementById(this.jsonDataViewId).style.display='none';
  }

  showGraphWindow(){
    document.getElementById(this.dataViewId).style.display='block';
    document.getElementById(this.semanticDataViewId).style.display='block';
  }

  showJsonWindow(){
    document.getElementById(this.jsonDataViewId).style.display='block';
  }

  get jsonDataViewId(){
    return `${this.windowId}_json_data_view`;

  }

  get jsonDataView() {
    return document.getElementById(this.jsonDataViewId);
  }

  get semanticDataViewId() {
    return `${this.windowId}_semantic_data_view`;
  }



  get semanticDataView() {
    return document.getElementById(this.semanticDataViewId);
  }
  
  get dataViewId() {
    return `${this.windowId}_data_view`;
  }

  get dataView() {
    return document.getElementById(this.dataViewId);
  }

  get formId() {
    return `${this.windowId}_form`;
  }

  get form() {
    return document.getElementById(this.formId);
  }

  get resultSelectId() {
    return `${this.windowId}_resultSelect`;
  }

  get resultSelect() {
    return document.getElementById(this.resultSelectId);
  }

  get queryButtonId() {
    return `${this.windowId}_query_button`;
  }

  get queryButton() {
    return document.getElementById(this.queryButtonId);
  }

  get queryTextAreaId() {
    return `${this.windowId}_query_text_area`;
  }

  get queryTextArea() {
    return document.getElementById(this.queryTextAreaId);
  }
  get idBatiment(){
    return this.idBatiment;
  }
  set idBatiment(val) {
    this.idBatiment=val;
  }

  static get EVENT_NODE_SELECTED() {
    return 'EVENT_NODE_SELECTED';
  }
}
