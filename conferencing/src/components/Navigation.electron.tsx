/*
********************************************
 Copyright © 2021 Agora Lab, Inc., all rights reserved.
 AppBuilder and all associated components, source code, APIs, services, and documentation 
 (the “Materials”) are owned by Agora Lab, Inc. and its licensors. The Materials may not be 
 accessed, used, modified, or distributed for any purpose without a license from Agora Lab, Inc.  
 Use without a license or in violation of any license terms and conditions (including use for 
 any purpose competitive to Agora Lab, Inc.’s business) is strictly prohibited. For more 
 information visit https://appbuilder.agora.io. 
*********************************************
*/
import React, {useEffect} from 'react';
import {ipcRenderer} from "electron";
import { useHistory } from "react-router-dom";

const processUrl = (url: string): string => {
  return url
    .replace(`${$config.PRODUCT_ID.toLowerCase()}://my-host//`, '')
    .replace($config.FRONTEND_ENDPOINT, '');
};

const Navigation = () => {
  const history = useHistory();
  useEffect( () => {
    const deepLink = (link: string) => {
      console.log('Deep-linking url: ', decodeURIComponent(link));
      if (link !== null) {
        const processedUrl = processUrl(decodeURIComponent(link));
        console.log('Processed-url', processedUrl)
        history.push(`/${processedUrl}`);
      }
    };

    ipcRenderer.on('ping', (event: any, message: string) => { 
        console.log(message, 'something') 
        // let route = message.split('//')[1];
        // console.log(history, route)
        // history.push(`/${route}`);
        deepLink(message);
    });

}, []);

  return <></>;
};

export default Navigation;
