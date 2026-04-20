import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './services/database';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  standalone: true,
})
export class AppComponent implements OnDestroy {
  private readonly databaseService = inject(DatabaseService);

  constructor() {
    // Initialize the plugin before any other method is called.
    void this.databaseService.initialize();
  }

  // this is just for web
  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    void this.databaseService.close();
  }

  ngOnDestroy(): void {
    void this.databaseService.close();
  }
}
