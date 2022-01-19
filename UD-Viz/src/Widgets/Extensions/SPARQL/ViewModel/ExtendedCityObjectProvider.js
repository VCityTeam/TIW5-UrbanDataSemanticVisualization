import { CityObjectProvider } from '../../../CityObjects/ViewModel/CityObjectProvider';
import { SemanticDataWindow } from '../View/SemanticDataWindow';


/**
 * A CityObjectProvider extention for selecting CityObjects using the batch table.
 */
export class ExtendedCityObjectProvider extends CityObjectProvider{
  /**
   * Create an ExtendedCityObjectProvider to provide cityobjects to the module
   * using a LayerManager
   *
   * @param {LayerManager} layerManager
   */
  constructor(layerManager) {
    super(layerManager);
    this.window = new SemanticDataWindow();
  }
 

  /**
   * Select a city object based on a corresponding key,value pair in the batch table.
   * @param {string} uri the URI to search by.
   */
  selectCityObjectByBatchTable(key, value) {
    this.windowSemanticData = new SemanticDataWindow();
    this.windowSemanticData.enableView();
    let cityObject = this.layerManager.pickCityObjectByBatchTable(key, value);
    if (cityObject) {
      if (this.selectedCityObject != cityObject) {
        if (this.selectedCityObject) {
          this.sendEvent(
            CityObjectProvider.EVENT_CITY_OBJECT_CHANGED,
            cityObject
          );
          this.unselectCityObject();
        } else {
          this.sendEvent(
            CityObjectProvider.EVENT_CITY_OBJECT_SELECTED,
            cityObject
          );
        }
        this.selectedCityObject = cityObject;
        this.selectedTilesManager = this.layerManager.getTilesManagerByLayerID(
          this.selectedCityObject.tile.layer.id
        );
        this.selectedStyle =
          this.selectedTilesManager.styleManager.getStyleIdentifierAppliedTo(
            this.selectedCityObject.cityObjectId
          );
        this.selectedTilesManager.setStyle(
          this.selectedCityObject.cityObjectId,
          'selected'
        );
        this.selectedTilesManager.applyStyles({
          updateFunction: this.selectedTilesManager.view.notifyChange.bind(
            this.selectedTilesManager.view
          ),
        });
        this.removeLayer();
      }
    }
  }
  enableView() {
    this.windowSemanticData.appendTo(this.parentElement);
  }

  /**
   *  Close the view
   */
  disableView() {
    this.windowSemanticData.dispose();
  }
}
