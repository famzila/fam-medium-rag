import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Message } from './models/message.model';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [NgClass, MatProgressBarModule],
  template: `
      <div [ngClass]="message().type === 'human' ? 'message-container lightgray' : 'message-container lightblue'">
        <div class="content" [innerHTML]="message().text"></div>
      </div>
  `,
  styles: [`
    .message-container {
      border-radius: 23px;
      display: flex;
      margin: 5px;
      padding: 10px;
      width: fit-content;
      align-items: center;
      position: relative;
    }

    .message-container.lightgray::before {
      content: "";
      position: absolute;
      width: 0;
      height: 0;
      border-top: 18px solid transparent;
      border-left: 11px solid #e3e9f0;
      right: -9px;
    }

    .message-container.lightblue::before {
      content: "";
      position: absolute;
      width: 0;
      height: 0;
      border-top: 18px solid transparent;
      border-right: 11px solid #cae2fa;
      left: -9px;
    }

    .lightgray {
      background-color: #e3e9f0;
    }

    .lightblue {
      background-color: #cae2fa;
    }

    .avatar {
      border-radius: 50%;
      margin-right: 10px;
    }

    .content {
      display: flex;
      flex-direction: column;
    }

    .content .name {
      font-weight: bold;
    }

    .content .text {
      margin-top: 5px;
    }`
  ]
})
export class MessageComponent {
  message = input.required<Message>();
}
