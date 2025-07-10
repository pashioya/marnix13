import { Page } from '@playwright/test';
import { parse } from 'node-html-parser';

export class Mailbox {
  constructor(private readonly page: Page) {}

  async visitMailbox(
    email: string,
    params: {
      deleteAfter: boolean;
    },
  ) {
    console.log(`Visiting mailbox ${email} ...`);

    const json = await this.getInviteEmail(email, params);

    if (!json?.HTML) {
      throw new Error('Email body was not found');
    }

    console.log('Email found');

    const html = json.HTML;
    const el = parse(html);

    const linkHref = el.querySelector('a')?.getAttribute('href');

    if (!linkHref) {
      throw new Error('No link found in email');
    }

    console.log(`Visiting ${linkHref} from mailbox ${email}...`);

    return this.page.goto(linkHref);
  }

  async getInviteEmail(
    email: string,
    params: {
      deleteAfter: boolean;
    },
  ) {
    const url = `http://127.0.0.1:54324/api/v1/search?query=to:${encodeURIComponent(email)}`;

    // Retry mechanism for email availability - optimized for faster retrieval
    let attempts = 0;
    const maxAttempts = 20; // Increase max attempts but with shorter delays
    const delayMs = 800; // Reduced delay for faster polling

    while (attempts < maxAttempts) {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText}`);
      }

      const json = (await response.json()) as { messages: Array<{ ID: string }> };

      if (json?.messages && json.messages.length > 0) {
        console.log(`Email found after ${attempts + 1} attempts`);
        
        // Get the most recent email (first in the list)
        const messageId = json.messages[0]?.ID;
        if (!messageId) {  
          throw new Error('Email message ID not found');  
        }  
        const messageUrl = `http://127.0.0.1:54324/api/v1/message/${messageId}`;

        const messageResponse = await fetch(messageUrl);

        if (!messageResponse.ok) {
          throw new Error(`Failed to fetch email: ${messageResponse.statusText}`);
        }

        // delete message
        if (params.deleteAfter) {
          console.log(`Deleting email ${messageId} ...`);

          const res = await fetch(messageUrl, {
            method: 'DELETE',
          });

          if (!res.ok) {
            console.error(`Failed to delete email: ${res.statusText}`);
          }
        }

        return await messageResponse.json();
      }

      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Email not found yet, waiting ${delayMs}ms before retry ${attempts + 1}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`No email found after ${maxAttempts} attempts`);
    return;
  }
}
