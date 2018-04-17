import {Component, OnDestroy, OnInit} from "@angular/core";
import {MainService} from "../../../src/service/main.service";

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit, OnDestroy{
  private outputFolder: string;
  private batch: number;
  private prefixUrl: string;
  private archive: boolean;
  private progressSubscription: any;
  private finishSubscription: any;
  private errorSubscription: any;
  private progress: number;
  private totalCodes: number;
  private indeterminateMode: string = "indeterminate";
  private determinateMode: string = "determinate";
  private mode: string = this.indeterminateMode;
  private action: string = "Validating csv...";
  private generating: boolean = false;
  private speedSec: number;
  private timeRemaining: number;
  private paused: boolean;
  private completed: boolean = true;
  private etaString: string;

  constructor(private mainService: MainService) {}

  ngOnInit(): void {
    let genParam = this.mainService.getGenerateParameters();
    this.outputFolder = genParam.outputPath;
    this.batch = genParam.subDirSplitCount;
    this.prefixUrl = genParam.urlPrefix;
    this.archive = genParam.shouldArchive;

    if (this.mainService.getGenerateParameters().generateNCodes > 0) {

    }
    this.totalCodes = this.mainService.getManifest().codes.batch_size;

    this.progressSubscription = this.mainService.$progressUpdate.subscribe(
      info => {
        let timeIndicatorString = "min";
        if (!this.generating) {
          this.completed = false;
          this.mode = this.determinateMode;
          this.action = "Generating QR codes..."
        }
        this.progress = (info.index / info.totalCodes) * 100;
        this.speedSec = info.speed;
        this.timeRemaining = info.timeRemaining;
        if (info.timeRemaining <= 1) {
          info.timeRemaining = info.timeRemaining * 60;
          timeIndicatorString = "sec";
        }

        this.etaString = `ETA ${Math.ceil(info.timeRemaining)} ${timeIndicatorString} (${Math.floor(info.speed)} image(s)/sec)`;
      }
    );
    this.finishSubscription = this.mainService.$finishSignal.subscribe(()=>{
      this.completed = true;
      this.action = "Generation completed!";
      this.progress = 100;
      this.speedSec = this.timeRemaining = 0;
      }
    );

    this.errorSubscription = this.mainService.$error.subscribe(err => {
      alert(err.message);
    })
  }

  ngOnDestroy(): void {
    this.progressSubscription.unsubscribe();
    this.errorSubscription.unsubscribe();
  }

  showLanding(): void {
    this.mainService.showLanding();
  }

  showInFolder(): void {
    this.mainService.showInFolder();
  }

  stop(): void {
    this.action = "Stopped...";
    this.paused = true;
    this.mainService.stopGenerating();
  }

  resume(): void{
    this.paused = false;
    this.mainService.generateCodes();
  }

  finish():void{
    this.mainService.sendFinishedSignal();
  }
}
