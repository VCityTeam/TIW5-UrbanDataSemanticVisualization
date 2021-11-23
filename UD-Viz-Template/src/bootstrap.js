/** @format */
console.log('Code boot here');

import * as udv from 'ud-viz'

let app = new udv.Templates.AllWidget();

app.start('../assets/config/config.json').then(() => {
  app.addBaseMapLayer();

  app.addElevationLayer();

  app.setupAndAdd3DTilesLayers();

  ////// REQUEST SERVICE
  const requestService = new udv.Components.RequestService();

  ////// ABOUT MODULE
  const about = new udv.Widgets.AboutWindow();
  app.addModuleView('about', about);

  ////// AUTHENTICATION MODULE
  const authenticationService =
    new udv.Widgets.Extensions.AuthenticationService(
      requestService,
      app.config
    );

  const authenticationView = new udv.Widgets.Extensions.AuthenticationView(
    authenticationService
  );
  app.addModuleView('authentication', authenticationView, {
    type: udv.Templates.AllWidget.AUTHENTICATION_MODULE,
  });

  ////// CITY OBJECTS MODULE
  let cityObjectModule = new udv.Widgets.CityObjectModule(
    app.layerManager,
    app.config
  );
  app.addModuleView('cityObjects', cityObjectModule.view);

  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udv.Widgets.Extensions.Debug3DTilesWindow(
    app.layerManager
  );
  app.addModuleView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

  ////// CAMERA POSITIONER
  const cameraPosition = new udv.Widgets.CameraPositionerView(
    app.view,
    app.controls
  );
  app.addModuleView('cameraPositioner', cameraPosition);

  // ////// TEMPORAL MODULE
  // const temporalModule = new udv.Widgets.TemporalModule(
  //   app.layerManager.tilesManagers[0],
  //   app.config.temporalModule
  // );
  // app.addModuleView("temporal", temporalModule.view);

  ////// LAYER CHOICE MODULE
  const layerChoice = new udv.Widgets.LayerChoice(app.layerManager);
  app.addModuleView('layerChoice', layerChoice);

  ////// SPARQL MODULE
  const sparqlModule = new udv.Widgets.Extensions.SparqlModule(app.config, app.layerManager);
  app.addModuleView('sparqlModule', sparqlModule.view, {
    name: 'SPARQL Query'
  });
});