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
  }

  /**
   * Query the SPARQL endpoint service
   * @param {string} query
   */
  async querySparqlEndpointService(query) {
    this.response = await this.service.querySparqlEndpoint(query);

    await this.sendEvent(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED,
      this.getResponseDataAsGraph()
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
      console.log('item', this.tokenizeURI(item.predicate.value).id);
      jsonEditedResult[this.tokenizeURI(item.predicate.value).id] = item.object.value;
    }
    return jsonEditedResult;
  }

  /**
   * 
   * @param {*} query 
   */
  async querySparqlEndpointServiceSemanticData(query) {
    this.response = await this.service.querySparqlEndpoint(query);
    console.log(this.response);
    await this.sendEvent(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA,
      this.getResponseDataAsJson(this.response.results.bindings)
    );
  }
 
  /**
   * return the most recently cached query response formatted for a D3.js graph.
   * @return {Object}
   */
  getResponseDataAsGraph() {
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
    console.log('respons from sparqlEndpointService: ',this.response);
    console.log('namespaces: ',this.namespaces);
    for (let triple of this.response.results.bindings) {
      console.log('triple: ', triple);
      if (
        graphData.nodes.find((n) => n.id == triple.subject.value) == undefined
      ) {
        let subjectNamespaceId = this.getNamespaceIndex(
          triple.subjectType.value
        );
        let node = { id: triple.subject.value, namespace: subjectNamespaceId };
        console.log('add subject: ', node);
        graphData.nodes.push(node);
      }
      if (
        graphData.nodes.find((n) => n.id == triple.object.value) == undefined
      ) {
        let objectNamespaceId = this.getNamespaceIndex(triple.objectType.value);
        let node = { id: triple.object.value, namespace: objectNamespaceId };
        console.log('add object: ', node);
        graphData.nodes.push(node);
      }
      let link = {
        source: triple.subject.value,
        target: triple.object.value,
        label: triple.predicate.value,
      };
      graphData.links.push(link);
    }
    graphData.legend = this.namespaces;
    return graphData;
  }

  /**
   * return the most recently cached query response formatted for a table.
   * @return {Object | undefined}
   */
  getResponseDataAsTable() {
    //TODO: implement me!
    return undefined;
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

  ////////////
  ///// EVENTS

  static get EVENT_ENDPOINT_RESPONSE_UPDATED() {
    return 'EVENT_ENDPOINT_RESPONSE_UPDATED';
  }

  static get EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA() {
    return 'EVENT_ENDPOINT_RESPONSE_UPDATED_SEMANTIC_DATA';
  }
}
