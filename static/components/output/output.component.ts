import {Component, OnDestroy, OnInit} from "@angular/core";
import {MainService} from "../../../src/service/main.service";
import {noUndefined} from "@angular/compiler/src/util";

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.css']
})
export class OutputComponent implements OnInit, OnDestroy {
  private batchSize: number = 1000;
  private outputFolder: string;
  private outputFolderSubscription: any;
  private totalCodes: string;
  private suffix: string = "archive";
  private shouldArchive: boolean = true;

  private nCodes: number = undefined;
  private generateAll: boolean = true;

  constructor(private mainService: MainService) {
    this.outputFolderSubscription = this.mainService.$outputFolder.subscribe(
      path => {
        this.outputFolder = path;
      }
    );
  }

  ngOnInit(): void {
    this.outputFolder = this.mainService.getOutputPath();
    this.totalCodes = this.mainService.getManifest().codes.batch_size;
  }

  ngOnDestroy(): void {
    this.outputFolderSubscription.unsubscribe();
  }

  changeOutputPath(): void {
    this.mainService.setOutputPath();
  }

  changeArchiveProperty(e): void {
    this.suffix = e.checked ? "archive" : "subfolder";
    this.shouldArchive = e.checked;
  }

  generateAllCodes(e): void {
    if (e.checked) {
      this.nCodes = undefined;
    } else {
      this.nCodes = parseInt(this.totalCodes);
    }
    this.generateAll = e.checked;
  }

  generateCodes(): void {
    this.mainService.setArchive(this.shouldArchive);
    this.mainService.setSubDirSplitCount(this.batchSize);
    this.mainService.setGenerateNCodes(this.nCodes);
    this.mainService.generateCodes();
  }
}
