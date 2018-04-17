import {Injectable, NgZone} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {GenerateParameters} from "../../static/model/generateParameters";
import {ipcRenderer} from 'electron';
import {CodeApplication} from "../../static/model/codeApplication";
import {CustomImage} from "../../static/model/customImage";

/**
 * This service handles and keeps track of the progress through the different screens.
 * The different options and settings the user can set will also be stored here.
 */
@Injectable()
export class MainService {
  private workOrderManifest: any;
  private workOrderUrl: string;
  private generateParams: GenerateParameters;

  // Preview parameters
  private previewExtendedId: string;
  private previewSerial: string;

  // Stream to navigate through the screens.
  // Landing screen stream
  private showLandingScreen = new Subject<boolean>();
  $showLandingScreen = this.showLandingScreen.asObservable();
  // Main screen stream (to start the configuration screens, start with prefix and dpi)
  private showMainScreen = new Subject<boolean>();
  $showMainScreen = this.showMainScreen.asObservable();
  // Customize no auth codes with custom image
  private showCustomizeScreen = new Subject<boolean>();
  $showCustomizeScreen = this.showCustomizeScreen.asObservable();
  // Output screen (to set the output folder and #batches)
  private showOutputStep = new Subject<boolean>();
  $showOutputStep = this.showOutputStep.asObservable();
  // Progress screen (to show progress and stop/resume progress)
  private showProgressStep = new Subject<boolean>();
  $showProgressStep = this.showProgressStep.asObservable();

  private outputFolder = new Subject<string>();
  $outputFolder = this.outputFolder.asObservable();
  private progressUpdate = new Subject<any>();
  $progressUpdate = this.progressUpdate.asObservable();
  private error = new Subject<any>();
  $error = this.error.asObservable();
  private finishSignal = new Subject<any>();
  $finishSignal = this.finishSignal.asObservable();

  constructor(zone: NgZone) {
    this.generateParams = new GenerateParameters();
    ipcRenderer.on('set-output-folder', (event, outputDir) => {
      if (outputDir.length > 0){
        zone.run(() => {
          if (this.generateParams.outputPath === undefined)
            this.showOutputScreen();
          this.generateParams.outputPath = outputDir[0];
          this.outputFolder.next(this.generateParams.outputPath);
        });
      }
    });
    ipcRenderer.on('progress-update', (event, speed, index, timeRemaining, totalCodes) => {
      zone.run(() => {
        let info: { speed: number, index: number, timeRemaining: number, totalCodes: number } = { speed: speed, index: index, timeRemaining: timeRemaining, totalCodes: totalCodes };
        this.progressUpdate.next(info);
      });
    });
    ipcRenderer.on('stopped-at-index', (event, index) => {
      zone.run(()=> {
        console.log("Stopped at index: " + index);
        this.generateParams.generateNCodes = this.generateParams.generateNCodes === undefined ? undefined : this.generateParams.generateNCodes-(++index); // index starts at 0 so +1
        console.log("Generate N codes new value: " + this.generateParams.generateNCodes);
      })
    });

    ipcRenderer.on('finished', (event) => {
      zone.run(()=> {
        console.log("Code generation finished");
        zone.run(() => {
          this.finishSignal.next();
        });
      })
    });
  }

  /**
   * Setters for the generation parameters
   */
  public setManifest(manifestFile) {
    this.workOrderManifest = manifestFile;
    this.generateParams.cellSizeInPx = this.workOrderManifest.code_type.carrier_cell_size;
    this.generateParams.placeholderCells = this.workOrderManifest.code_type.placeholder_cells;
    this.showMainScreen.next(true);
  }

  public setUrlPrefix(prefix: string) {
    if (!prefix.endsWith("/"))
      prefix += "/";
    this.generateParams.urlPrefix = prefix;
  }

  public setDpi(dpi: number): void {
    this.generateParams.dpi = dpi;
  }

  public setSubDirSplitCount(size: number): void {
    this.generateParams.subDirSplitCount = size;
  }

  public setArchive(shouldArchive: boolean): void {
    this.generateParams.shouldArchive = shouldArchive;
  }

  public setCellSizeInPx(cellSize: number): void {
    this.generateParams.cellSizeInPx = cellSize;
  }

  public setCustomImage(image: CustomImage): void {
    this.generateParams.customImage = image;
  }

  public setWorkOrderType(type: CodeApplication) {
    this.generateParams.workOrderType = CodeApplication[type];
  }

  public setOutputFormat(format: string, pngSize: number): void {
    this.generateParams.outputFormat = format;
    this.generateParams.physicalSizeInCm = pngSize ? (pngSize / 10) : null;
  }

  public setPreviewExtendedId(previewId: string): void {
    this.previewExtendedId = previewId;
  }

  public setPreviewSerial(previewSerial: string): void {
    this.previewSerial = previewSerial;
  }

  public setGenerateNCodes(nCodes): void {
    this.generateParams.generateNCodes = nCodes;
  }

  public resetCellInPx(): void {
    this.generateParams.cellSizeInPx = this.workOrderManifest.code_type.carrier_cell_size;
  }

  /**
   * Getters for the generation parameters
   */
  public getOutputPath(): string {
    return this.generateParams.outputPath;
  }

  public getGenerateParameters(): GenerateParameters {
    return this.generateParams;
  }

  public getPreviewExtendedId(): string {
    return this.previewExtendedId;
  }

  public getPreviewSerial(): string {
    return this.previewSerial;
  }

  /**
   * Getters for manifest file attributes
   */
  public getManifest(): any { // we could pass model object of the manifest file
    return this.workOrderManifest;
  }

  public getWorkOrderType(): CodeApplication {
    return this.workOrderManifest.workorder.code_application;
  }

  public getCellSizeInPx(): number {
    return this.workOrderManifest.code_type.carrier_cell_size;
  }

  /**
   * ipcRenderer invokers
   */
  public setOutputPath(): void {
    ipcRenderer.send('select-output-folder');
  }

  public generateCodes(): void {
    this.showProgressStep.next(true);
    this.setWorkOrderType(this.getWorkOrderType());
    ipcRenderer.send('generate', this.generateParams);
  }

  public stopGenerating(): void {
    ipcRenderer.send('stop-generating');
  }

  public sendFinishedSignal(): void {
    ipcRenderer.send('finished');
  }

  public showInFolder(): void {
    ipcRenderer.send('show-in-folder', this.generateParams.outputPath);
  }

  /**
   * Show another screen
   */
  public showLanding(): void {
    this.generateParams = new GenerateParameters();
    this.showLandingScreen.next(true);
  }

  public previewImage(): void {
    this.showCustomizeScreen.next(true);
  }

  public continueOutputScreen(): void {
    this.showOutputScreen();
  }

  private showOutputScreen(): void {
    this.showOutputStep.next(true);
  }

  /**
   * Set and get work order url
   */
  public setWorkOrderUrl(fileUrl): void {
    this.workOrderUrl = fileUrl;
  }

  public getWorkOrderUrl(): string {
    return this.workOrderUrl;
  }
}
