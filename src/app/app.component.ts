import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.component.html',
  selector: 'app-root',
})
export class AppComponent {
  title = 'typ';
}
