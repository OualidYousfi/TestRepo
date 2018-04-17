import {NgModule} from "@angular/core";
import {CustomizeComponent} from "./customize/customize.component";
import {DetailComponent} from "./detail/detail.component";
import {DropzoneComponent} from "./dropzone/dropzone.component";
import {LandingComponent} from "./landing/landing.component";
import {MainComponent} from "./main/main.component";
import {MruComponent} from "./mru/mru.component";
import {OutputComponent} from "./output/output.component";
import {PrefixComponent} from "./prefix/prefix.component";
import {ProgressComponent} from "./progress/progress.component";
import {SidesComponent} from "./sides/sides.component";
import {CommonModule} from "@angular/common";
import {CustomMaterialModule} from "../material-module/material.module";

@NgModule({
  imports: [CommonModule, CustomMaterialModule],
  declarations: [
    CustomizeComponent,
    DetailComponent,
    DropzoneComponent,
    LandingComponent,
    MainComponent,
    MruComponent,
    OutputComponent,
    PrefixComponent,
    ProgressComponent,
    SidesComponent
  ],
  exports: [
    CustomizeComponent,
    DetailComponent,
    DropzoneComponent,
    LandingComponent,
    MainComponent,
    MruComponent,
    OutputComponent,
    PrefixComponent,
    ProgressComponent
  ]
})

export class ComponentModule { }
