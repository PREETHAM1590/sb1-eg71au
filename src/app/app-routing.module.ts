import { NgModule } from '@angular/core'
import { Routes } from '@angular/router'
import { NativeScriptRouterModule } from '@nativescript/angular'

import { SignLanguageRecognitionComponent } from './sign-language-recognition/sign-language-recognition.component'

const routes: Routes = [
  { path: '', redirectTo: '/sign-language', pathMatch: 'full' },
  { path: 'sign-language', component: SignLanguageRecognitionComponent },
]

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule],
})
export class AppRoutingModule {}