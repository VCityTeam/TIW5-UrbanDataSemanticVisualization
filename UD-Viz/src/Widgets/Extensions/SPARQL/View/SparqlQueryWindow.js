import { Window } from '../../../Components/GUI/js/Window';
import { SparqlEndpointResponseProvider } from '../ViewModel/SparqlEndpointResponseProvider';
import { Graph } from './Graph';
import { LayerManager } from '../../../Components/Components';
import { ExtendedCityObjectProvider } from '../ViewModel/ExtendedCityObjectProvider';
import './SparqlQueryWindow.css';
import { BuildingGraph } from './BuildingGraph';
import { JsonView } from './JsonView';

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
     * Contains the D3 graph view to display building
     *
     * @type {Graph}
     */
    this.building=new BuildingGraph(this);

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

    this.addEventListener(SparqlQueryWindow.EVENT_NODE_SELECTED, (uri) => {
      this.semanticDataView.hidden=false;
      var idBatiment= this.sparqlProvider.tokenizeURI(uri).id; //get id of selected building
      //Get building informations based on id
      var semantic_data_query = `PREFIX mydata: <https://github.com/VCityTeam/UD-Graph/LYON_1ER_BATI_2015-20_bldg-patched#>
    SELECT * 
    WHERE {?subject ?predicate ?object . 
    FILTER((?subject = mydata:${idBatiment}))
    }`;
      this.sparqlProvider.querySparqlEndpointServiceSemanticData(semantic_data_query);
      return this.cityObjectProvider.selectCityObjectByBatchTable(
        'gml_id',
        this.sparqlProvider.tokenizeURI(uri).id
      );
    }
    );
    this.sparqlProvider.addEventListener(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA,
      (data) => this.updateSemanticDataView(data)
    );


  }

  /**
   * Update the window.
   * @param {Object} data SPARQL query response data.
   * @param {Object} viewType The selected semantic data view type.
   */
  updateDataView(data, viewType) {
    switch(viewType){
      case 'graph':
        this.hideJsonWindow();
        this.showGraphWindow();
        this.graph.update(data);
        this.dataView.style['visibility'] = 'visible';
        this.dataView.append(this.graph.data);
        break;
      case 'json':
        this.hideGraphWindow();
        this.showJsonWindow();
        var  jsonData=JSON.stringify(data, undefined, 2);
        this.jsonView.update(jsonData);
        this.jsonDataView.style['visibility'] = 'visible';
        this.jsonDataView.append(this.jsonView.data);
        break;
      default:
        console.log('ce format est pas disponible');

    }
   
  }
  /**
   * Update the window to show semantic data of given node
   * @param {*} data  SPARQL query response data
   */

  updateSemanticDataView(data) {
    this.building.update(data);
    this.semanticDataView.style['visibility'] = 'visible';
    this.semanticDataView.innerHTML='';
    this.semanticDataView.append(this.building.data);
  }

  // SPARQL Window getters //
  get innerContentHtml() {
    return /*html*/ `
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
