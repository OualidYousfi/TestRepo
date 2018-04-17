/**
 * Add required material design components in this module.
 */
import {NgModule} from "@angular/core";

import {
  MdButtonModule, MdRadioModule, MdInputModule, MdCheckboxModule, MdProgressBarModule,
  MdSliderModule
} from '@angular/material';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  imports: [BrowserAnimationsModule, MdButtonModule, MdRadioModule, MdInputModule, MdCheckboxModule, MdProgressBarModule, MdSliderModule],
  exports: [MdButtonModule, MdRadioModule, MdInputModule, MdCheckboxModule, MdProgressBarModule, MdSliderModule],
})
export class CustomMaterialModule { }
