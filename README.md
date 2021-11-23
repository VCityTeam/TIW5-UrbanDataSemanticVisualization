# TIW5-UrbanDataSemanticVisualization

A demonstration for visualizing RDF semantic graphs alongside 3D City models using:
* [UD-Viz](https://github.com/VCityTeam/UD-Viz) as a frontend web application for urban data visualization
  * In particular the [SPARQL module](https://github.com/VCityTeam/UD-Viz/tree/master/src/Widgets/Extensions/SPARQL) is used to visualize semantic urban data in the form of RDF
* [3D Tiles Server](https://github.com/CesiumGS/3d-tiles-samples) to serve 3D Tiles datasets
* [Strabon RDF Store](http://www.strabon.di.uoa.gr/) an RDF-Store for storing and serving geospatial semantic graph data in the form of RDF
* [PostGIS](https://postgis.net/) a geospatial database extension of [PostgreSQL](https://www.postgresql.org/) used here as a backend database for Strabon

## Installation

### Pre-requisites

* [Install Docker](https://docs.docker.com/engine/install/)
* [Install Docker Compose](https://docs.docker.com/compose/install/)

* **Ubuntu**

  * Installation

    ```bash
    sudo apt-get install npm    ## Will pull NodeJS
    sudo npm install -g n     
    sudo n latest
    ```

  * References: [how can I update Nodejs](https://askubuntu.com/questions/426750/how-can-i-update-my-nodejs-to-the-latest-version), and [install Ubuntu](http://www.hostingadvice.com/how-to/install-nodejs-ubuntu-14-04/#ubuntu-package-manager)

* **Windows**
  
  * Installing from the [installer](https://nodejs.org/en/download/)
  * Installing with the [CLI](https://en.wikipedia.org/wiki/Command-line_interface)

    ```bash
    iex (new-object net.webclient).downstring(‘https://get.scoop.sh’)
    scoop install nodejs
    ```

## Installing and running the template application

The template application can be locally (on your desktop) started in the following way: 
```
cd ./UD-Viz
npm install
cd ../UD-Viz-Template
npm install
npm run debug      # integrates building
```
and then use your favorite (web) browser to open
`http://localhost:8000/`.

### Build Images
If other ports are declared in the `.env` for `PostGIS` or `Strabon` make sure to also update them in the `./UD-Viz-Template/assets/config/config.json` file before building their respective docker images.

We start with building the Postgis and Strabon docker images:
```
docker-compose build
```

Once the images are built initialize their containers:
```
docker-compose up
```

## Upload RDF-Store Dataset
For the SPARQL module to function an RDF dataset must be uploaded to Strabon. To do this:
1. Open a web browser and navigate to `localhost:8997/strabon`
2. From the left menu, click *Explore/Modify operations* then *Configuration*
3. Enter the configuration for **PostGIS** as declared in the `.env` configuration file then click *Connect*
   * You may also be asked to enter administrative credentials for Strabon. In this case the username and password are declared in the `.env` as well
4. From the left menu, click *Explore/Modify operations* then *Store*
5. Set the *RDF Format* dropdown to `RDF/XML`
6. Copy and paste the first RDF dataset, located here [`./data/LYON_1ER_BATI_2015-20_bldg-patched1`](./data/LYON_1ER_BATI_2015-20_bldg-patched1) into the *Direct Input* field and click *Store Input*
7. Repeat step 6 for the remaining RDF datasets

## Known Issues
- The connection between the Strabon and PostGIS is known to break upon restarting their containers. To fix this, with all containers stopped, delete the Strabon container and restart the service with docker-compose:
```
docker rm ud-demo-graph-sparql_strabon_1
```