import {
  Component,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { AlertDialogService } from '../../../services/alert-dialog.service';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.css'
})
export class AlertDialogComponent {

  constructor(
    public alertDialog: AlertDialogService
  ) {}

  close(): void {
    this.alertDialog.dismiss();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}