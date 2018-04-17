import {Component, OnDestroy, OnInit} from "@angular/core";
import {MainService} from "../../../src/service/main.service";
import {CustomizeService} from "../../../src/service/customize.service";
import {CodeApplication} from "../../model/codeApplication";
import {CustomImage} from "../../model/customImage";
import {CustomString} from "../../model/customString";
import {GenerateParameters} from "../../model/generateParameters";

@Component({
  selector: 'app-customize',
  templateUrl: './customize.component.html',
  styleUrls: ['./customize.component.css']
})
export class CustomizeComponent implements OnInit, OnDestroy{
  private _imageUrl: any = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="; // transparent gif
  private _image: CustomImage;
  private presentCenterImage: boolean = false;
  private noauth: boolean;
  private png: boolean;

  private imageSubscription: any;
  private newPreviewSubscription: any;
  private maxSizeSubscription: any;

  private addHash: boolean = false;
  private addSerial: boolean = false;
  private addWhiteSpace: boolean = false;
  private hashString: any = null;
  private serialString: any = null;
  private serialNumberPresent: boolean = false;

  // Image size in percent and error correction
  private centerImageSize: number;
  private minImageSize = 1;
  private maxImageSize = 0;

  private cellSizeInPx: number;

  constructor(private mainService: MainService, private customizeService: CustomizeService) {}

  ngOnInit(): void {
    this.noauth = this.mainService.getWorkOrderType() === CodeApplication.NO_AUTH;
    this.cellSizeInPx = this.mainService.getCellSizeInPx();
    this.serialNumberPresent = this.mainService.getPreviewSerial() !== "";
    this.png = this.mainService.getGenerateParameters().outputFormat === "PNG";

    this.imageSubscription = this.customizeService.$preview.subscribe(
      preview => {
        this._imageUrl = "data:image/png;base64," + preview;
      }
    );
    this.newPreviewSubscription = this.customizeService.$newPreview.subscribe(
      regenerate => {
        if (regenerate) {
          this.presentCenterImage = true;
          if (this.noauth) { // Get the maximum size for this image
            this.customizeService.getMaxImageSize(this._populateGenerationOption());
          }
        }
      }
    );
    this.maxSizeSubscription = this.customizeService.$maxSize.subscribe(
      maxSize => {
        this.maxImageSize = maxSize * 100;
        this.centerImageSize = this.maxImageSize;
        this._regenerateQrCode();
      }
    );
    this._regenerateQrCode();
  }

  setCenterImage(url): void {
    if (url.length > 0) {
      this.customizeService.selectImage(url);
      this.presentCenterImage = true;
    } else
      this.presentCenterImage = false;
  }

  ngOnDestroy(): void {
    // unsubscribe from the subscriptions
    this.imageSubscription.unsubscribe();
    this.newPreviewSubscription.unsubscribe();
    this.maxSizeSubscription.unsubscribe();

    // reset the image
    this.customizeService.clearCenterImage();
  }

  selectImage(): void {
    if (this.noauth)
      this.customizeService.selectImage();
  }

  imageSizeChange(e): void {
    this.centerImageSize = e.value;
    this._regenerateQrCode();
  }

  cellSizeInPxChange(e): void {
    this.cellSizeInPx = e.target.value;
    this._regenerateQrCode();
  }

  hashOrientation(orientation: number): void {
    if (this.hashString !== null)
      this.hashString.gravity = orientation;
    this._regenerateQrCode();
  }

  serialOrientation(orientation: number): void {
    if (this.serialString !== null)
      this.serialString.gravity = orientation;
    this._regenerateQrCode();
  }

  addHashTextToggle(e): void {
    this._hashToggle(e.checked);
    this._regenerateQrCode();
  }

  private _hashToggle(shouldAdd: boolean): void {
    this.addHash = shouldAdd;
    if (shouldAdd) {
      this.hashString = new CustomString();
      this.hashString.text = this.mainService.getPreviewExtendedId();
      this.hashString.gravity = 1; // Default hash location is on top
      this.hashString.type = "hash";
      this.addWhiteSpace = true;
    } else {
      this.hashString = null;
      if (!this.addSerial)
        this.addWhiteSpace = false;
    }
  }

  addWhiteSpaceToggle(e): void {
    this.addWhiteSpace = e.checked;
    if (!this.addWhiteSpace) {
      this._hashToggle(false);
      this._serialToggle(false);
    }
    this._regenerateQrCode();
  }

  addSerialToggle(e): void {
    this._serialToggle(e.checked);
    this._regenerateQrCode();
  }

  private _serialToggle(shouldAdd: boolean): void {
    this.addSerial = shouldAdd;
    if (shouldAdd) {
      this.serialString = new CustomString();
      this.serialString.text = this.mainService.getPreviewSerial();
      this.serialString.gravity = 3; // Default serial location is on the bottom
      this.serialString.type = "serial";
      this.addWhiteSpace = true;
    } else {
      this.serialString = null;
      if (!this.addHash)
        this.addWhiteSpace = false;
    }
  }

  nextStep(): void {
    this.mainService.setCustomImage(this._image);
    this.mainService.setOutputPath();
  }

  private _regenerateQrCode(): void {
    this.customizeService.regenerate(this._populateGenerationOption());
  }

  private _populateGenerationOption(): GenerateParameters {
    let genParams = this.mainService.getGenerateParameters();
    let image: CustomImage = null;
    // Depending on the work order type, different custom image is provided to the preview generator
    if (this.noauth) {
      if (this.customizeService.getCenterImage() !== null) {
        image = new CustomImage();
        image.image = this.customizeService.getCenterImage();
        image.size = this.centerImageSize / 100; // set the size in %
      }
    } else if(this.mainService.getWorkOrderType() !== CodeApplication.HYBRID) {
      image = new CustomImage();
      image.isFingerprint = true;
    }
    this._image = image;

    // Populate the generation parameters
    genParams.customStrings = [];
    if (this.hashString !== null)
      genParams.customStrings.push(this.hashString);
    if (this.serialString !== null)
      genParams.customStrings.push(this.serialString);

    genParams.cellSizeInPx = this.cellSizeInPx;
    genParams.shouldAddWhiteSpaceBorder = this.addWhiteSpace;
    genParams.customImage = image;
    return genParams;
  }

  resetCustomization(): void {
    let genParams = this.mainService.getGenerateParameters();
    genParams.customImage = new CustomImage();
    genParams.customStrings = [];
    this.customizeService.clearCenterImage();
    this._image = null;
    this.hashString = null;
    this.serialString = null;
    this.addHash = false;
    this.addSerial = false;
    this.addWhiteSpace = false;
    this.presentCenterImage = false;
    this.mainService.resetCellInPx();
    this.cellSizeInPx = this.mainService.getCellSizeInPx();
    this._regenerateQrCode();
  }

  /**
   *  Drag and drop event handlers
   */
  onDrop(e: any): void {
    e.preventDefault();
  }

  onDragOver(e: any): void {
    e.preventDefault();
  }

  onDragEnter(e: any): void {
    if (this.noauth)
      this.setCenterImage(e.dataTransfer.files[0].path);
  }

  onDragLeave(e: any): void {
    //this.setImageUrl("");
  }
}
