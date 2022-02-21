import { EventSender } from '../../../../Components/Events/EventSender';
import { SparqlEndpointService } from '../Model/SparqlEndpointService';

/**
 * Creates a SPARQL Endpoint Provider which manages treating SPARQL endpoint
 * responses and events for a specific SPARQL Endpoint. Also contains helper
 * functions for manipulating RDF data.
 */
export class SparqlEndpointResponseProvider extends EventSender {
  /**
   * Creates a SPARQL Endpoint Provider
   *
   * @param {SparqlEndpointService} service a SPARQL endpoint service.
   */
  constructor(service) {
    super();

    /**
     * The SPARQL Endpoint Service..
     *
     * @type {SparqlEndpointService}
     */
    this.service = new SparqlEndpointService(service);

    /**
     * The most recent query response.
     *
     * @type {Object}
     */
    this.response = {};

    /**
     * An array containing each namespace in the dataset.
     *
     * @type {Array}
     */
    this.namespaces = [];

    this.registerEvent(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED
    );

    this.registerEventSemanticData(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA
    );

    this.registerEventJsonData( SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED_JSON_DATA);
  }

  /**
   * Query the SPARQL endpoint service
   * @param {string} query
   */
  async querySparqlEndpointService(query) {
    this.response = await this.service.querySparqlEndpoint(query);

    await this.sendEvent(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED,
      await  this.getResponseDataAsGraph()
    );

  }
  /**
   * 
   * @param {*} jsonData 
   * @returns 
   */
  getResponseDataAsJson(jsonData){
    var jsonEditedResult = {
    };
    for(var key in jsonData) {    
      var item = jsonData[key];
      jsonEditedResult[this.tokenizeURI(item.predicate.value).id] = item.object.value;
    }
    return jsonEditedResult;
  }


  /**
   * building details
   * @param {*} query
   */
  async querySparqlEndPointBuildingData(query){
    this.response= await this.service.querySparqlEndpoint(query);
    return  this.response.results.bindings;
  }

  /**
   * 
   * @param {*} query 
   */
  async querySparqlEndpointServiceSemanticData(query) {
    this.response = await this.service.querySparqlEndpoint(query);
    await this.sendEvent(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA,
      this.getResponseDataBatimentAsGraph(this.response.results.bindings)
    );
  }

  async querySparqlEndpointServiceJsonData(query) {
    this.response = await this.service.querySparqlEndpoint(query);
    await this.sendEvent(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED_JSON_DATA,
      this.getResponseDataAsJson(this.response.results.bindings)
    );
  }


  /**
   * return  a building id
   * @return {String}
   */
  getBuildingID(url){
    var id=this.tokenizeURI(url).id;
    return id;
  }

  /**
   * return  details of a building
   * @return {Array}
   */
  async  getBuildingDetails(buildingId){
    let tabDetails=[];
    // let json={
    //   'value':'',
    //   'label':''
    // };
    var semantic_data_query = `PREFIX mydata: <https://github.com/VCityTeam/UD-Graph/LYON_1ER_BATI_2015-20_bldg-patched#>
          SELECT * 
          WHERE {?subject ?predicate ?object . 
          FILTER((?subject = mydata:${buildingId}))
          }`;
    var results= await this.querySparqlEndPointBuildingData(semantic_data_query);
    var valuesRenvoyeesJson=JSON.stringify(results);
    var valuesRenvoyees=JSON.parse(valuesRenvoyeesJson);
    for(var i=0;i<Object.keys(valuesRenvoyees).length;i++){
      if(!(valuesRenvoyees[i].object.value.includes('#Building')) && !(valuesRenvoyees[i].object.value.includes('#NamedIndividual')) ){
        //tabDetails.push(valuesRenvoyees[i].object.value);
        // json.value=valuesRenvoyees[i].object.value;
        // json.label=valuesRenvoyees[i].object.label;
        let json = {
          value: valuesRenvoyees[i].object.value,
          label: valuesRenvoyees[i].predicate.value,
        };
        tabDetails.push(json);
        console.log('valeur tableau'+tabDetails[0].label);
      }
    }
    return tabDetails;
  }
 
  /**
   * return the most recently cached query response formatted for a D3.js graph.
   * @return {Object}
   */
  async  getResponseDataAsGraph() {
    let graphData = {
      nodes: [
        // { id: 'x', namespace: 1 },
        // { id: 'y', namespace: 2 },
      ],
      links: [
        // { source: 'x', target: 'y', value: 1 }
      ],
      legend: undefined,
    };

    for (let triple of this.response.results.bindings) {
      let buildingDetails=[];
      let buildingUrl=triple.object.value;
      let buildingId=this.getBuildingID(buildingUrl);
      buildingDetails=await this.getBuildingDetails(buildingId);

      console.log('valeur de buildings details'+buildingDetails[0].value+''+buildingDetails[0].label);
      for(var i=0; i<buildingDetails.length;i++){
        if(graphData.nodes.find((n)=>n.id==buildingDetails[i].value)==undefined){
          let node={ id: buildingDetails[i].value, namespace:2};
          graphData.nodes.push(node);
        }
      }

      if (graphData.nodes.find((n) => n.id == triple.subject.value) == undefined) {
        let subjectNamespaceId = this.getNamespaceIndex(triple.subject.value);
        let node = { id: triple.subject.value, namespace: subjectNamespaceId };
        graphData.nodes.push(node);
      }
      if (graphData.nodes.find((n) => n.id == triple.object.value) == undefined) {
        let objectNamespaceId = this.getNamespaceIndex(triple.objectType.value);
        let node = { id: triple.object.value, namespace: objectNamespaceId };
        graphData.nodes.push(node);
      }
      let link = {
        source: triple.subject.value,
        target: triple.object.value,
        label: triple.predicate.value,
      };
      for(var j=0; j<buildingDetails.length;j++){
        let link = {
          source: buildingDetails[j].value,
          target: triple.object.value,
          label: buildingDetails[j].label,
        };
        graphData.links.push(link);
      }
      graphData.links.push(link);
    }
    graphData.legend = this.namespaces;
    return graphData;
  }



  /**
   * Tokenize a URI into a namespace and id
   * @param {string} uri
   * @returns {Object}
   */
  tokenizeURI(uri) {
    let tokenizedURI = {};
    if (uri.includes('#')) {
      let uriTokens = uri.split('#');
      tokenizedURI.namespace = uriTokens[0] + '#';
      tokenizedURI.id = uriTokens[1];
    } else {
      let uriTokens = uri.split('/');
      tokenizedURI.id = uriTokens[uriTokens.length - 1];
      uriTokens[uriTokens.length - 1] = '';
      tokenizedURI.namespace = uriTokens.join('/');
    }
    return tokenizedURI;
  }

  /**
   * Get the namespace index of a uri. Add the namespace to the array of namespaces
   * if it does not exist.
   * @param {String} uri the uri to map to a namespace.
   * @return {Number}
   */
  getNamespaceIndex(uri) {
    let namespace = this.tokenizeURI(uri).namespace;
    if (!this.namespaces.includes(namespace)) {
      this.namespaces.push(namespace);
    }
    return this.namespaces.findIndex((d) => d == namespace);
  }



  static get EVENT_ENDPOINT_RESPONSE_UPDATED() {
    return 'EVENT_ENDPOINT_RESPONSE_UPDATED';
  }

  static get EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA() {
    return 'EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA';
  }

}