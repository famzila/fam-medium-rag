import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APIResponse } from '../models/message.model';
import { config } from '../../../../config';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly httpClient= inject(HttpClient);

  /**
   * Send the user query to the backend and get the response
   * @param question the user query
   * @returns response from the backend
   */
  postMessage(question: string) {
    // Send question to the backend
    return this.httpClient.post<APIResponse>(`${config.backendUrl}/messages`, { question }, {
      headers: {
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true'
      }
    }).pipe(take(1));
  }
}
