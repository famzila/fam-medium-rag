import { AfterViewChecked, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from './message/message.component';
import { catchError, map, of, startWith } from 'rxjs';
import { MessageService } from './message/services/message.service';
import { Message, APIResponse } from './message/models/message.model';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [RouterOutlet, MatCardModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    NgClass,
    MatButtonModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatIconModule, MessageComponent]
})
export class AppComponent implements AfterViewChecked {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  messages = signal<Message[]>([]);
  messageContainer = viewChild.required<ElementRef>('messageContainer');
  questionForm = this.fb.group({
    question: ['']
  });
  isEmptyQuestion = toSignal(this.questionForm.get('question')!.valueChanges.pipe(startWith(''),
    map(question => (question === '' || question == null))));
  
  /**
   * After every view checked, scroll to the bottom of the chat container
   */
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  /**
   * When the user submits the form, update messages and send the question to the backend
   */
  submitForm(): void {
    const { question } = this.questionForm.value;
    if (!question) return;
    
    // disable input while waiting for response
    this.questionForm.disable();

    // Add question to the chat (UI)
    this.messages.update(messages => [...messages, {
      text: question,
      type: 'human'
    }]);

    this.processQuestion(question);
  }

  /**
   * Send the user query to the backend and get the response
   * @param question the user query
   */
  private processQuestion(question: string): void {
    // Temporary display "Thinking..."
    this.messages.update(messages => [...messages, {
      text: 'Thinking...',
      type: 'loading'
    }]);

    // Send question to the backend
    this.messageService.postMessage(question).pipe(
      catchError(error => {
        console.error(error);
        this.messages.update(messages => [...messages.slice(0, -1), {
              text: 'Sorry, I\'m having trouble understanding you right now. Please try again later.',
              type: 'bot'
            }]);
        return of(null);
      })
    ).subscribe((response: APIResponse | null) => {
      if (response) {
        // Update messages with the response and remove the "Thinking..." message
        this.messages.update(messages => [...messages.slice(0, -1), {
          text: `${response?.answer}${response?.relevantLinksHtml}`,
          type: 'bot'
        }]);
      }
      this.resetForm();
    });
  }

  /**
   * Reset the form after submitting a question
   */
  private resetForm(): void {
    this.questionForm.enable();
    this.questionForm.reset();
  }

  /**
   * Scroll to the bottom of the chat container
   */
  private scrollToBottom(): void {
    // Scroll to latest message 
    const last = this.messageContainer()?.nativeElement.lastElementChild;
    last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
