import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IListItem } from './IListItem';

import styles from './HelloWorldWebPart.module.scss';
import * as strings from 'HelloWorldWebPartStrings';

export interface IHelloWorldWebPartProps {
  listName: string;
}

export default class HelloWorldWebPart extends BaseClientSideWebPart <IHelloWorldWebPartProps> {

  public render(): void {
    this.domElement.innerHTML =`
    <div class="${ styles.helloWorld }">
      <div class="${ styles.container }">
        <div class="${ styles.row }">
          <div class="${ styles.column }">
            <span class="${ styles.title }">CRUD operations</span>
            <p class="${ styles.subTitle }">No Framework</p>
            <p class="${ styles.description }">Name: ${escape(this.properties.listName)}</p>

            <div class="ms-Grid-row ms-bgColor-themeDark ms-fontColor-white ${styles.row}">
              <div class="ms-Grid-col ms-u-lg10 ms-u-xl8 ms-u-xlPush2 ms-u-lgPush1">
                <button class="${styles.button} create-Button">
                  <span class="${styles.label}">Create item</span>
                </button>
                <button class="${styles.button} read-Button">
                  <span class="${styles.label}">Read item</span>
                </button>
              </div>
            </div>

            <div class="ms-Grid-row ms-bgColor-themeDark ms-fontColor-white ${styles.row}">
              <div class="ms-Grid-col ms-u-lg10 ms-u-xl8 ms-u-xlPush2 ms-u-lgPush1">
                <button class="${styles.button} update-Button">
                  <span class="${styles.label}">Update item</span>
                </button>
                <button class="${styles.button} delete-Button">
                  <span class="${styles.label}">Delete item</span>
                </button>
              </div>
            </div>

            <div class="ms-Grid-row ms-bgColor-themeDark ms-fontColor-white ${styles.row}">
              <div class="ms-Grid-col ms-u-lg10 ms-u-xl8 ms-u-xlPush2 ms-u-lgPush1">
                <div class="status"></div>
                <ul class="items"><ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>`;
    this.setButtonsEventHandlers();
  }

  private setButtonsEventHandlers(): void {
    const webPart: HelloWorldWebPart = this;
    this.domElement.querySelector('button.create-Button').addEventListener('click', () => { webPart.createItem(); });
    this.domElement.querySelector('button.read-Button').addEventListener('click', () => {  webPart.readItem(); });
    this.domElement.querySelector('button.update-Button').addEventListener('click', () => { webPart.updateItem(); });
    this.domElement.querySelector('button.delete-Button').addEventListener('click', () => { webPart.deleteItem(); });
    this.readItem();
  }

  private removePostbacksForClassicPages() {
    // The pages always post back on classic pages, and this script removes the calls to the post backs.
   // if (Environment.type === EnvironmentType.ClassicSharePoint) {
    /* tslint:disable */
    //React.ReactDOM.findDOMNode<HTMLInputElement>(this);
    var thisDomElement = this.domElement;
    /* tslint:enable */
    const buttons = thisDomElement.getElementsByTagName('button');
    if (buttons && buttons.length) {
      for (let i: number = 0; i < buttons.length; i++) {
        if (buttons[i]) {
          /* tslint:disable */
          // Disable the button onclick postback
          buttons[i].onclick = function () { return false; };
          /* tslint:enable */
        }
      }
  //  }
    }
  }
  private createItem(): void {
    const body: string = JSON.stringify({
      'Title': `Item ${new Date()}`
    });
    this.context.spHttpClient.post(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.properties.listName}')/items`,
    SPHttpClient.configurations.v1,
    {
      headers: {
        'Accept': 'application/json;odata=nometadata',
        'Content-type': 'application/json;odata=nometadata',
        'odata-version': ''
      },
      body: body
    })
    .then((response: SPHttpClientResponse): Promise<IListItem> => {
      return response.json();
    })
    .then((item: IListItem): void => {
      this.updateStatus(`Item '${item.Title}' (ID: ${item.Id}) successfully created`);
    }, (error: any): void => {
      this.updateStatus('Error while creating the item: ' + error);
    });

  }

  private updateStatus(status: string, items: IListItem[] = []): void {
    this.domElement.querySelector('.status').innerHTML = status;
    this.updateItemsHtml(items);
  }

  private updateItemsHtml(items: IListItem[]): void {
    this.domElement.querySelector('.items').innerHTML = items.map(item => `<li>${item.Title} (${item.Id})</li>`).join("");
  }

  private readItem(): boolean {
    this.getLatestItemId()
      .then((itemId: number): Promise<SPHttpClientResponse> => {
        if (itemId === -1) {
          throw new Error('No items found in the list');
        }

        this.updateStatus(`Loading information about item ID: ${itemId}...`);

        return this.context.spHttpClient.get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.properties.listName}')/items?$select=Title,Id`,
          SPHttpClient.configurations.v1,
          {
            headers: {
              'Accept': 'application/json;odata=nometadata',
              'odata-version': ''
            }
          });
      })
      .then((response: SPHttpClientResponse)  => {
        return response.json();
      })
      .then((response): void => {
        if(response.value.length > 0)
          this.updateStatus(`Item ID: ${response.value[0].Id}, Title: ${response.value[0].Title}`,response.value);
          else
          this.updateStatus(`Nix gefunden`);
      }, (error: any): void => {
        this.updateStatus('Loading latest item failed with error: ' + error);
      });
      return false;
    }

  private updateItem(): void {
    let latestItemId: number = undefined;
    this.updateStatus('Loading latest item...');

    this.getLatestItemId()
      .then((itemId: number): Promise<SPHttpClientResponse> => {
        if (itemId === -1) {
          throw new Error('No items found in the list');
        }

        latestItemId = itemId;
        this.updateStatus(`Loading information about item ID: ${itemId}...`);

        return this.context.spHttpClient.get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.properties.listName}')/items(${latestItemId})?$select=Title,Id`,
          SPHttpClient.configurations.v1,
          {
            headers: {
              'Accept': 'application/json;odata=nometadata',
              'odata-version': ''
            }
          });
      })
      .then((response: SPHttpClientResponse): Promise<IListItem> => {
        return response.json();
      })
      .then((item: IListItem): void => {
        this.updateStatus(`Item ID1: ${item.Id}, Title: ${item.Title}`);

        const body: string = JSON.stringify({
          'Title': `Updated Item ${new Date()}`
        });

        this.context.spHttpClient.post(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.properties.listName}')/items(${item.Id})`,
          SPHttpClient.configurations.v1,
          {
            headers: {
              'Accept': 'application/json;odata=nometadata',
              'Content-type': 'application/json;odata=nometadata',
              'odata-version': '',
              'IF-MATCH': '*',
              'X-HTTP-Method': 'MERGE'
            },
            body: body
          })
          .then((response: SPHttpClientResponse): void => {
            this.updateStatus(`Item with ID: ${latestItemId} successfully updated`);
          }, (error: any): void => {
            this.updateStatus(`Error updating item: ${error}`);
          });
      });
  }

  private deleteItem(): void {
    if (!window.confirm('Are you sure you want to delete the latest item?')) {
      return;
    }

    this.updateStatus('Loading latest items...');
    let latestItemId: number = undefined;
    let etag: string = undefined;
    this.getLatestItemId()
      .then((itemId: number): Promise<SPHttpClientResponse> => {
        if (itemId === -1) {
          throw new Error('No items found in the list');
        }

        latestItemId = itemId;
        this.updateStatus(`Loading information about item ID: ${latestItemId}...`);
        return this.context.spHttpClient.get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.properties.listName}')/items(${latestItemId})?$select=Id`,
          SPHttpClient.configurations.v1,
          {
            headers: {
              'Accept': 'application/json;odata=nometadata',
              'odata-version': ''
            }
          });
      })
      .then((response: SPHttpClientResponse): Promise<IListItem> => {
        etag = response.headers.get('ETag');
        return response.json();
      })
      .then((item: IListItem): Promise<SPHttpClientResponse> => {
        this.updateStatus(`Deleting item with ID: ${latestItemId}...`);
        return this.context.spHttpClient.post(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.properties.listName}')/items(${item.Id})`,
          SPHttpClient.configurations.v1,
          {
            headers: {
              'Accept': 'application/json;odata=nometadata',
              'Content-type': 'application/json;odata=verbose',
              'odata-version': '',
              'IF-MATCH': etag,
              'X-HTTP-Method': 'DELETE'
            }
          });
      })
      .then((response: SPHttpClientResponse): void => {
        this.updateStatus(`Item with ID: ${latestItemId} successfully deleted`);
      }, (error: any): void => {
        this.updateStatus(`Error deleting item: ${error}`);
      });
  }

  private getLatestItemId(): Promise<number> {
    return new Promise<number>((resolve: (itemId: number) => void, reject: (error: any) => void): void => {
      this.context.spHttpClient.get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${this.properties.listName}')/items?$orderby=Id desc&$top=1&$select=id`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            'Accept': 'application/json;odata=nometadata',
            'odata-version': ''
          }
        })
        .then((response: SPHttpClientResponse): Promise<{ value: { Id: number }[] }> => {
          return response.json();
        }, (error: any): void => {
          reject(error);
        })
        .then((response: { value: { Id: number }[] }): void => {
          if (response.value.length === 0) {
            resolve(-1);
          }
          else {
            resolve(response.value[0].Id);
          }
        });
    });
  }

  protected get dataVersion(): Version {
  return Version.parse('1.0');
}

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
  return {
    pages: [
      {
        header: {
          description: strings.PropertyPaneDescription
        },
        groups: [
          {
            groupName: strings.BasicGroupName,
            groupFields: [
              PropertyPaneTextField('listName', {
                label: strings.ListNameFieldLabel
              })
            ]
          }
        ]
      }
    ]
  };
}
}
