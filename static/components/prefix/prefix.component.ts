import {Component} from "@angular/core";
import {MainService} from "../../../src/service/main.service";
import {CodeApplication} from "../../model/codeApplication";

@Component({
  selector: 'app-prefix',
  templateUrl: './prefix.component.html',
  styleUrls: ['./prefix.component.css']
})
export class PrefixComponent {
  private customUrl: boolean;
  private workOrderPrefixText: string;
  private customPrefixText: string;
  private dpiIsChangeable: boolean = false;
  private dpi: number;
  private isPng: boolean;
  private pngSize: number = 15;
  private outputFormat: string = "TIFF";

  constructor(private mainService: MainService) {
    let manifest = this.mainService.getManifest();
    this.workOrderPrefixText = manifest.workorder.url_prefix;
    this.dpi = manifest.code_type.resolution_dpi;
    if (manifest.workorder.code_application === CodeApplication.HYBRID || manifest.workorder.code_application === CodeApplication.NO_AUTH) {
      this.dpiIsChangeable = true;
    }
    this.customPrefixText = this.workOrderPrefixText;
  }

  urlSelect(e): void {
    this.customUrl = e.value == 2;
  }

  outputFormatSelect(e): void {
    this.isPng = e.value === "PNG";
    this.outputFormat = e.value;
  }

  nextStep(): void {
    this.savePrefix();
    this.saveDpi();
    this.mainService.setOutputFormat(this.outputFormat, this.pngSize);
    this.mainService.previewImage();
  }

  savePrefix(): void {
    this.mainService.setUrlPrefix(this.customUrl ? this.customPrefixText : this.workOrderPrefixText);
  }

  saveDpi(): void {
    this.mainService.setDpi(this.dpi);
  }

  isNoAuth(): boolean {
    return this.mainService.getWorkOrderType() === CodeApplication.NO_AUTH;
  }
}
