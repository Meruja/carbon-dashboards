/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var getAsset, getAssets, addAsset, deleteAsset;

(function () {
    var log = new Log();

    var dir = '/store/';

    var utils = require('/modules/utils.js');
    var config = require('/extensions/stores/es/config.json')

    var assetsDir = function (ctx, type) {
        var carbon = require('carbon');
        var config = require('/configs/designer.json');
        var domain = config.shareStore ? carbon.server.superTenant.domain : ctx.domain;
        return dir + domain + '/es/' + type + '/';
    };

    var obtainAuthorizedHeaderForAPICall = function () {
        var authenticate = post(config.authenticationApi, {"password": config.authConfiguration.password,
            "username": config.authConfiguration.username }, {}, 'json');
        var header = {
            'Cookie': "JSESSIONID=" + authenticate.data.data.sessionId + ";",
            'Accept': 'application/json'
        };
        return header;
    };

    getAsset = function (type, id) {
        if (type === 'layout') {
            return;
        }
        var ctx = utils.currentContext();
        var parent = assetsDir(ctx, type);
        var file = new File(parent + id);
        if (!file.isExists()) {
            return null;
        }
        file = new File(file.getPath() + '/' + type + '.json');
        if (!file.isExists()) {
            return null;
        }
        file.open('r');
        var asset = JSON.parse(file.readAll());
        file.close();
        return asset;
    };

    getAssets = function (type, query, start, count) {
        if (type === 'layout') {
            return;
        }
        //get list of published assets from ES
        var headers = obtainAuthorizedHeaderForAPICall();
        var assets = parse((get(config.publishedAssetApi, headers, 'application/json')).data).data;
        var publishedAssets = [];
        for (var i = 0; i < assets.length; i++) {
            var asset_id = (assets[i]['attributes']['overview_name'] + config.dirNameSeperator
                + assets[i]['attributes']['overview_version']).replace(/ /g, config.dirNameSeperator);
            publishedAssets.push(asset_id);
        }

        // fetch published assets from ES
        var ctx = utils.currentContext();
        var parent = new File(assetsDir(ctx, type));
        var assetz = parent.listFiles();
        var assets = [];
        for (var j = 0; j < publishedAssets.length; j++) {
            query = query ? new RegExp(query, 'i') : null;
            assetz.forEach(function (file) {
                if (publishedAssets[j] === file.getName()) {
                    if (!file.isDirectory()) {
                        return;
                    }
                    file = new File(file.getPath() + '/' + type + '.json');
                    if (file.isExists()) {
                        file.open('r');
                        var asset = JSON.parse(file.readAll());
                        if (!query) {
                            assets.push(asset);
                            file.close();
                            return;
                        }
                        var title = asset.title || '';
                        if (!query.test(title)) {
                            file.close();
                            return;
                        }
                        assets.push(asset);
                        file.close();
                    }
                }
            });
        }
        var end = start + count;
        end = end > assets.length ? assets.length : end;
        assets = assets.slice(start, end);
        return assets;
    };

    addAsset = function (asset) {

    };

    deleteAsset = function (id) {

    };
}());