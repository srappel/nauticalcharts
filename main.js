  // creates a new openseadragon viewer elements for the modal
  var viewer = OpenSeadragon({
      id: "openseadragon1",
      prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@2.4/build/openseadragon/images/"      
  });        
  
  // Function to download the GeoJSON object from the REST API    
  function downloadGeoJson(text, name) {
    var a = document.createElement('a');
    var type = name.split(".").pop();
    a.href = URL.createObjectURL( new Blob([text], { type:`text/${type === "txt" ? "plain" : type}` }) );
    a.download = name;
    a.click();
  }    

  // AGOL API JS
  require([
    "esri/Map", 
    "esri/views/MapView",
    "esri/layers/FeatureLayer", 
    "esri/layers/MapImageLayer",
    "esri/geometry/Extent",
    "esri/smartMapping/statistics/uniqueValues",
    "esri/widgets/Search",
    ], function(Map, MapView, FeatureLayer, MapImageLayer, Extent, uniqueValues, Search){
  // Create a style for the chartsLayer
  var renderer = {
    type: "simple",  // autocasts as new SimpleRenderer()
    symbol: {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [ 255, 128, 0, 0.5 ],
      outline: {  // autocasts as new SimpleLineSymbol()
        width: 1,
        color: "white"
      }
    }
  }; 

  // Layer for the nautical charts 
  var chartsLayer = new FeatureLayer({
    url: "https://webgis.uwm.edu/arcgisuwm/rest/services/AGSL/agsl_nautical/MapServer/0",
    outFields: ["*"], // Return all fields so it can be queried client-side
    renderer: renderer
  });

  // Layer for the graticule
  var gridLayer = new MapImageLayer({
    url: "https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/graticule/MapServer",
    visible: false
  });

  // Create the Map and add the featureLayer defined above
  map = new Map({
    basemap: "oceans",
    layers: [chartsLayer, gridLayer]
  });
 
  // Create the MapView
  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [0,0],       
    zoom: 3,
    background: { // autocasts as new ColorBackground()
      color: "#719AC8" // autocasts as new Color()
   }
  });  

  // Sources for the search widget to search our own dataset
  // In this case we use the chartsLayer
  var sources = [
  {
    layer: chartsLayer,
    searchFields: ["label", "title"],
    displayField: "title",
    exactMatch: false,
    outFields: ["*"],
    name: "AGSL Nautical Charts",
    placeholder: "Enter chart label or title",
    maxResults: 6,
    maxSuggestions: 6,
    zoomScale: 90000000, // use this to prevent charts disappearing when the user zooms in
    suggestionsEnabled: true,
    minSuggestCharacters: 0,
    filter: { where: $('#setFilter').val()},
  }
  ];

  // Add the search bar widget
  var searchWidget = new Search({
    sources: sources,
    view: view,
    locationEnabled: false
  });

  // Adds the search widget below other elements in
  // the top left corner of the view
  view.ui.add(searchWidget, {
    position: "top-right",
    index: 2,
  });
  
  
  // Create the dropdown menu for the select filter
  var selectFilter = document.createElement("select");
  selectFilter.setAttribute("class", "esri-widget esri-select");
  selectFilter.setAttribute(
    "style",
    "width: 275px; font-family: Avenir Next W00; font-size: 1em;"
  );
  selectFilter.id = 'setFilter';

  // Select menu default disabled option
  var disabledOpt = document.createElement("option");
  disabledOpt.textContent = 'Select chart a series';
  disabledOpt.disabled = true;
  //disabledOpt.selected = true;

  selectFilter.appendChild(disabledOpt);
  
  view.ui.add(selectFilter, "top-right");

  // Run a query on the chartsLayer to get unique field values from 'setTitle'
  var query = chartsLayer.createQuery();
  query.where = "1=1";
  query.outFields = [ "setTitle" ];
  query.returnDistinctValues = true;
  query.returnGeometry = false;

  // Use the response of the query to auto-populate the dropdown menus
  // for the chartsLayer filter and series select dropdown
  chartsLayer.queryFeatures(query)
    .then(function(response){
      var seriesSelect = document.getElementById('series');
      var filterSelect = document.getElementById('setFilter');
      // returns the unique values from the setTitle field
      var features = response.toJSON().features;    
      Object.values(features).forEach(function(value) {
        // for the series options on the download modal
        var seriesVal = value.attributes.setTitle;
        var seriesOpt = document.createElement("option");
        seriesOpt.textContent = seriesVal;
        seriesOpt.value = seriesVal;
        seriesSelect.appendChild(seriesOpt);        
        // for the series options on the main map filter
        var filterOpt = document.createElement("option");
        filterOpt.textContent = seriesVal;
        filterOpt.placeholder = 'Select a series';
        filterOpt.value = "setTitle = " + "'" + seriesVal + "'";
        filterSelect.appendChild(filterOpt);
        // Select French Charts by default
        if (seriesVal == 'French Charts') {
          filterOpt.selected = true;                  
        }
      });         
    });

  $('#setFilter').change(); 

  // creates a new image viewer for the popup modal
  function viewImage() {    
    var imageId = view.popup.selectedFeature.attributes.sheetId; 
    viewer.open( "https://collections.lib.uwm.edu/digital/iiif/agdm/" + imageId + "/");
    $('#imageModal').modal('show');
  }   

  // Create a template for the popup
  var template = {
  // autocasts as new PopupTemplate()
  title: "<font color='#008000'>{title}",  
  content: [     
        {
      type: "media",
      mediaInfos: [
        {
          title: "",
          type: "image",
          value: {sourceURL: '{thumbURL}'}
        }
      ]          
        },{
      type: "fields",
      fieldInfos: [
        {
          fieldName: "label",
          label: "label"
        },
        {
          fieldName: "west",
          label: "West"
        },
        {
          fieldName: "east",
          label: "East"
        },
        {
          fieldName: "north",
          label: "North"
        },
        {
          fieldName: "south",
          label: "South"
        },
        {
          fieldName: "scale",
          label: "Scale"
        },
        {
          fieldName: "title",
          label: "title"
        },
        {
          fieldName: "edition",
          label: "edition"
        },
        {
          fieldName: "available",
          label: "available"
        },
        {
          fieldName: "physHold",
          label: "physHold"
        },
        {
          fieldName: "primeMer",
          label: "primeMer"
        },
        {
          fieldName: "projection",
          label: "projection"
        },
        {
          fieldName: "datePub",
          label: "datePub"
        },
        {
          fieldName: "color",
          label: "color"
        },
        {
          fieldName: "recId",
          label: "recId"
        },
        {
          fieldName: "note",
          label: "note"
        },
        {
          fieldName: "sheetId",
          label: "sheetId"
        },
        {
          fieldName: "digital ID",
          label: "digita"
        },
        {
          fieldName: "titleAlt",
          label: "titleAlt"
        },
        {
          fieldName: "digHold",
          label: "digHold"
        },
        {
          fieldName: "thumbURL",
          label: "thumbURL"
        },
        {
          fieldName: "miradorURL",
          label: "miradorURL"
        },
        {
          fieldName: "iiifURL",
          label: "iiifURL"
        },
        {
          fieldName: "location",
          label: "location"
        },
        {
          fieldName: "bathLines",
          label: "bathLines"
        },
        {
          fieldName: "bathInterv",
          label: "bathInterv"
        },
        {
          fieldName: "instCallNo",
          label: "instCallNo"
        },
      ]
    }, 
  ]
};

// template for charts missing sheetId
var template2 = {
  // autocasts as new PopupTemplate()
  title: "<font color='#008000'>{title}",  
  content: [     
        {
      type: "media",
      mediaInfos: [
        {
          title: "",
          type: "image",
          value: {sourceURL: 'img/default.jpg'}
        }
      ]          
        },{
      type: "fields",
      fieldInfos: [
        {
          fieldName: "label",
          label: "label"
        },
        {
          fieldName: "west",
          label: "West"
        },
        {
          fieldName: "east",
          label: "East"
        },
        {
          fieldName: "north",
          label: "North"
        },
        {
          fieldName: "south",
          label: "South"
        },
        {
          fieldName: "scale",
          label: "Scale"
        },
        {
          fieldName: "title",
          label: "title"
        },
        {
          fieldName: "edition",
          label: "edition"
        },
        {
          fieldName: "available",
          label: "available"
        },
        {
          fieldName: "physHold",
          label: "physHold"
        },
        {
          fieldName: "primeMer",
          label: "primeMer"
        },
        {
          fieldName: "projection",
          label: "projection"
        },
        {
          fieldName: "datePub",
          label: "datePub"
        },
        {
          fieldName: "color",
          label: "color"
        },
        {
          fieldName: "recId",
          label: "recId"
        },
        {
          fieldName: "note",
          label: "note"
        },
        {
          fieldName: "sheetId",
          label: "sheetId"
        },
        {
          fieldName: "digital ID",
          label: "digita"
        },
        {
          fieldName: "titleAlt",
          label: "titleAlt"
        },
        {
          fieldName: "digHold",
          label: "digHold"
        },
        {
          fieldName: "thumbURL",
          label: "thumbURL"
        },
        {
          fieldName: "miradorURL",
          label: "miradorURL"
        },
        {
          fieldName: "iiifURL",
          label: "iiifURL"
        },
        {
          fieldName: "location",
          label: "location"
        },
        {
          fieldName: "bathLines",
          label: "bathLines"
        },
        {
          fieldName: "bathInterv",
          label: "bathInterv"
        },
        {
          fieldName: "instCallNo",
          label: "instCallNo"
        },
      ]
    }, 
  ]
};

// Set the popup template on the layer
chartsLayer.popupTemplate = template;

// Show popup template based on if we have a valid sheetId
view.when(function () {
  // Watch for when features are selected
  view.popup.watch("selectedFeature", function (graphic) {
    if (graphic) {
      if (graphic.attributes.sheetId == "") {
       // if we don't have a sheetId show a different popup 
       chartsLayer.popupTemplate = template2;
       // remove the imageviewer action from the popup
       view.popup.viewModel.actions.getItemAt(1).visible = false;
      console.log('null');
      } else {
      console.log('not null');
      chartsLayer.popupTemplate = template;
       view.popup.viewModel.actions.getItemAt(1).visible = true;
      }
    }
  })
});

// Actions for the popup
var imageViewerAction = {
  // This text is displayed as a tooltip
  title: "Full Image",
  // The ID by which to reference the action in the event handler
  id: "view-image",
  // Sets the icon font used to style the action button
  className: "esri-icon-maps"
};
// Adds the custom action to the popup.
view.popup.actions.push(imageViewerAction);

// This event fires for each click on any action
view.popup.on("trigger-action", function(event){
  // If the view image action is clicked, fire the viewImage() function
  if(event.action.id === "view-image"){
    viewImage();
  }
});

function setFeatureLayerFilter(expression) {
  chartsLayer.definitionExpression = expression;  
}

// Display the French Charts on map load
setFeatureLayerFilter("setTitle = 'French Charts'" );

view.watch("zoom", function(newValue) {
  var series = $('#setFilter').val();
  if (newValue <= 2 && newValue < 3) {
    // at low zooms levels show all charts
    setFeatureLayerFilter(series);
  } else if (newValue >= 3 && newValue < 4) {    
    // as the users zooms in show only larger scale charts
    setFeatureLayerFilter(series + "AND Shape_Area <  ‎ ‎19463642202000"); 
  } else if (newValue >= 4 && newValue < 5) {
    setFeatureLayerFilter(series + "AND Shape_Area <  ‎ ‎‎5463642202000");
  }  else if (newValue >= 5 && newValue < 7) {
    setFeatureLayerFilter(series + "AND Shape_Area <  ‎ ‎‎‎463642202000");
  } else if (newValue >= 7) {
    setFeatureLayerFilter(series + "AND Shape_Area <  ‎ ‎‎‎8636422022");
  }
  console.log("scale property changed: ", newValue);
});

// filter the chartsLayer using the attributes in the dropdown. 
selectFilter.addEventListener('change', function (event) { 
console.log($('#setFilter').val()); 
  setFeatureLayerFilter(event.target.value);
  // zoom to the full extent of the filter result
  chartsLayer
  .when(function() {
    return chartsLayer.queryExtent();
  })
  .then(function(response) {
    // zoom to the extent of query
    view.goTo({
      center: response.extent,
      zoom: 2
    });
  });
});

// Add element for the info button using Esri widgets
var infoBtn = document.createElement('div');
infoBtn.className = "esri-icon-description esri-widget--button esri-widget esri-interactive";
infoBtn.addEventListener('click', function(event){
  // when the download button is clicked show the modal
  $('#infoModal').modal('show') 
})

view.ui.add(infoBtn, "top-left");

// Add element for the download button using Esri widgets
var downloadBtn = document.createElement('div');
downloadBtn.className = "esri-icon-download esri-widget--button esri-widget esri-interactive";
downloadBtn.addEventListener('click', function(event){
  // when the download button is clicked show the modal
  $('#dataModal').modal('show') 
})

view.ui.add(downloadBtn, "top-left");

// Add element for the graticule button using Esri widgets
var gridBtn = document.createElement('div');
gridBtn.className = "esri-icon-locate esri-widget--button esri-widget esri-interactive";
gridBtn.addEventListener('click', function(event){
  // add and remove the graticule from the map
  if (gridLayer.visible == false) {
    gridLayer.visible = true;
  } else {
    gridLayer.visible = false;
  }
})

view.ui.add(gridBtn, "top-left");

var download = document.getElementById('download');

// Code for when the download button is clicked
getDataBtn.addEventListener('click', function(event){ 
  var seriesVal = document.getElementById('series').value;
  var dataFormat = document.getElementById('format').value;
  console.log(seriesVal, dataFormat);
  if (dataFormat == 'csv') {  
    // Get the charts data from the ArcGIS REST API
    // Use an HTTP get request
    $.ajax({
            dataType: 'json',
            url: 'https://webgis.uwm.edu/arcgisuwm/rest/services/AGSL/agsl_nautical/MapServer/0/query?where=setTitle+%3D+%27' + seriesVal + '%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=geojson',
            type: "GET",    
            success: function(data) {                      
              // The output fields for the CSV, if new ones are added must add here 
              // label fields are the CSV headers, values are the CSV values          
              var fields = [            
                {
                  label: 'label', 
                  value: 'properties.label',
                  default: 'NULL' 
                },
                {
                  label: 'title', 
                  value: 'properties.title',
                  default: 'NULL' 
                },
                {
                  label: 'datePub', 
                  value: 'properties.datePub',
                  default: 'NULL' 
                },
                {
                  label: 'scale', 
                  value: 'properties.scale',
                  default: 'NULL' 
                },
                {
                  label: 'primeMer', 
                  value: 'properties.primeMer',
                  default: 'NULL' 
                },
                {
                  label: 'west', 
                  value: 'properties.west',
                  default: 'NULL' 
                },
                {
                  label: 'east', 
                  value: 'properties.east',
                  default: 'NULL' 
                },
                 {
                  label: 'north', 
                  value: 'properties.north',
                  default: 'NULL' 
                },
                 {
                  label: 'south', 
                  value: 'properties.south',
                  default: 'NULL' 
                },
                {
                  label: 'color', 
                  value: 'properties.color',
                  default: 'NULL' 
                },
                 {
                  label: 'available', 
                  value: 'properties.available',
                  default: 'NULL' 
                },
                 {
                  label: 'physHold', 
                  value: 'properties.physHold',
                  default: 'NULL' 
                },
                {
                  label: 'edition', 
                  value: 'properties.edition',
                  default: 'NULL' 
                },
                {
                  label: 'publisher', 
                  value: 'properties.projection',
                  default: 'NULL' 
                },
                {
                  label: 'projection', 
                  value: 'properties.projection',
                  default: 'NULL' 
                },
                {
                  label: 'location', 
                  value: 'properties.location',
                  default: 'NULL' 
                },
                {
                  label: 'digHold', 
                  value: 'properties.digHold',
                  default: 'NULL' 
                },
                {
                  label: 'bathInterv', 
                  value: 'properties.bathInterv',
                  default: 'NULL' 
                },
                {
                  label: 'bathLines', 
                  value: 'properties.bathLines',
                  default: 'NULL' 
                },
                {
                  label: 'note', 
                  value: 'properties.note',
                  default: 'NULL' 
                },
                {
                  label: 'recId', 
                  value: 'properties.recId',
                  default: 'NULL' 
                },
                {
                  label: 'iiifUrl', 
                  value: 'properties.iiifURL',
                  default: 'NULL' 
                },
              ] 
              // replace spaces in file name with underscores 
              var csvFileName = seriesVal.split(' ').join('_') + '.csv';   
              var parser = new json2csv.Parser({fields});            
              var csv = parser.parse(data.features);
              var element = document.createElement('a');
              element.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
              element.target = '_blank';
              element.download = csvFileName;
              element.click();            
            }
    });
  } else if (dataFormat == 'geojson') {
    $.ajax({
          dataType: 'json',
          url: 'https://webgis.uwm.edu/arcgisuwm/rest/services/AGSL/agsl_nautical/MapServer/0/query?where=setTitle+%3D+%27' + seriesVal + '%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=geojson',
          type: "GET",    
          success: function(data) {
            // replace spaces in file name with underscores 
            var jsonFileName = seriesVal.split(' ').join('_') + '.geojson';             
            downloadGeoJson(JSON.stringify(data, undefined, 4), jsonFileName);           
          }
    });   
  }
})
})