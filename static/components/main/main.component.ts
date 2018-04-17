import {Component, OnDestroy, OnInit} from "@angular/core";
import {MainService} from "../../../src/service/main.service";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy{
  private showPrefixStep: boolean = true;
  private showOutputStep: boolean = false;
  private showProgressStep: boolean = false;
  private showCustomizeStep: boolean = false;
  private stepSubscriptions: Array<any> = [];

  constructor(private mainService: MainService) {}

  ngOnInit(): void {
    this.stepSubscriptions.push(this.mainService.$showOutputStep.subscribe(
      show => {
        if (show) {
          this.showPrefixStep = false;
          this.showProgressStep = false;
          this.showCustomizeStep = false;
          this.showOutputStep = true;
        }
      }
    ));
    this.stepSubscriptions.push(this.mainService.$showProgressStep.subscribe(
      show => {
        if (show) {
          this.showPrefixStep = false;
          this.showOutputStep = false;
          this.showCustomizeStep = false;
          this.showProgressStep = true;
        }
      }
    ));
    this.stepSubscriptions.push(this.mainService.$showCustomizeScreen.subscribe(
      show => {
        if (show) {
          this.showPrefixStep = false;
          this.showProgressStep = false;
          this.showOutputStep = false;
          this.showCustomizeStep = true;
        }
      }
    ));
  }

  ngOnDestroy(): void {
    this.stepSubscriptions.forEach(function (subscription) {
      if (subscription != null)
        subscription.unsubscribe();
    });
  }
}
