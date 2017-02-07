if (window.location.pathname.indexOf("/Pages/") > 1) {
    $(document).ready(function() {

        (SP.Ribbon.PageManager.get_instance()).add_ribbonInited(ribbon_init);
        SelectRibbonTab('Ribbon.Read', true);
        SamplePageComponent.initializePageComponent();

    });

    /*Get ribbon's instance and call custom button addition code*/
    function ribbon_init() {
        var ribbon, clientContext;
        clientContext = SP.ClientContext.get_current();

        if (clientContext) {
            getListContentTypes(clientContext).then(function(contentTypeCount) {
                if (contentTypeCount > 0) {
                    ribbon = (SP.Ribbon.PageManager.get_instance()).get_ribbon();
                    appendButton(ribbon);
                }
            });
        }
    }
    /*Get name of content type's associated with pages library*/
    function getListContentTypes(clientContext) {
        var currentWeb, listCollection, pagesList, contentTypeCollection, deferred, getContentType,
            contentTypeCount, contentTypeEnumerator, contentTypeName, archivalContentTypeName;
        var archiveContentTypeList = new Array();
        nexGen.services.applicationConfigPromise.then(function(configKey) {
            if (configKey) {
                archivalContentTypeName = configKey.ArchivalContentTypeName.toLowerCase();
            }
        });
        archivalContentTypeName = archivalContentTypeName.split(";")
        deferred = $.Deferred();
        currentWeb = clientContext.get_web();
        listCollection = currentWeb.get_lists();
        pagesList = currentWeb.get_lists().getByTitle('Pages');
        this.contentTypeCollection = pagesList.get_contentTypes();
        clientContext.load(this.contentTypeCollection);

        clientContext.executeQueryAsync(
            Function.createDelegate(this, function() {
                contentTypeCount = 0;
                contentTypeEnumerator = this.contentTypeCollection.getEnumerator();
                while (contentTypeEnumerator.moveNext()) {
                    getContentType = contentTypeEnumerator.get_current();
                    contentTypeName = getContentType.get_name().toLowerCase();
                    $.each(archivalContentTypeName, function(contentKey, contentVal) {
                        if (contentVal.trim() === contentTypeName) {
                            contentTypeCount += 1;
                        }
                    })
                }
                deferred.resolve(contentTypeCount);
            }),
            Function.createDelegate(this, function(sender, args) {
                deferred.reject(sender, args);
            }));

        return deferred.promise();

    }

    /* Add custom group,section,layout and button with required properties in ribbon's file tab*/
    function appendButton(ribbon) {
        var customTab, customGroup, customLayout, customSection, customControlProp,
            customButton, controlComponent, btnLocation;

        customTab = ribbon.getChildByTitle("Files");

        customGroup = new CUI.Group(ribbon, 'Custom.Tab.Group', 'Archive Link', 'Group Description', 'Custom.Group.Command', null);
        customTab.addChild(customGroup);

        customLayout = new CUI.Layout(ribbon, 'Custom.Layout', 'The Layout');
        customGroup.addChild(customLayout);

        customSection = new CUI.Section(ribbon, 'Custom.Section', 2, 'Top');
        customLayout.addChild(customSection);

        customControlProp = new CUI.ControlProperties();
        customControlProp.Command = 'Custom.Button.Command';
        customControlProp.Id = 'Custom.ControlProperties';
        customControlProp.TemplateAlias = 'o1';
        customControlProp.ToolTipDescription = 'Move selected page to pages archive library';
        customControlProp.Image32by32 = '_layouts/15/images/placeholder32x32.png';
        customControlProp.ToolTipTitle = 'Send to pages archive';
        customControlProp.LabelText = 'Archive Page';
        customButton = new CUI.Controls.Button(ribbon, 'Custom.Button', customControlProp);
        controlComponent = customButton.createComponentForDisplayMode('Large');

        btnLocation = customSection.getRow(1);
        btnLocation.addChild(controlComponent);
        customGroup.selectLayout('The Layout');

        SelectRibbonTab('Ribbon.Read', true);
    }
    /*Return selected file name*/
    function GetName(itemId) {
        var currentList, deferred, itemName, context;
        context = SP.ClientContext.get_current();
        deferred = $.Deferred();
        currentList = context.get_web().get_lists().getById(SP.ListOperation.Selection.getSelectedList());
        itemName = currentList.getItemById(itemId);
        context.load(itemName, 'FileRef');
        context.executeQueryAsync(
            Function.createDelegate(this,
                function() {
                    deferred.resolve(itemName.get_item('FileRef'));
                }),
            Function.createDelegate(this,
                function(sender, args) {
                    deferred.reject(sender, args);
                }));

        return deferred.promise();

    }

    /*Returns imformation regarding target library existence*/
    function targetLibExist(archiveLibraryUrl) {
        var deferred, request;
        deferred = $.Deferred();
        request = new XMLHttpRequest();

        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    deferred.resolve(true);
                } else {
                    //alert("Pages Archive library does not exist on this subsite");

                    deferred.reject(false);
                }
            }
        };
        request.open('GET', archiveLibraryUrl, true);
        request.send();

        return deferred.promise();

    }

    function contentTypeExitInTarget(archiveLibraryName) {
        var clientContext, 
			currentWeb, 
			listCollection, 
			pagesList, 
			contentTypeCollection,
 		  	getContentType,contentTypeCount,
			contentTypeEnumerator, 
			contentTypeName, 	
			archivalContentTypeName,
			archiveContentTypeList = [],
			deferred = $.Deferred();
        nexGen.services.applicationConfigPromise.then(function(configKey) {
            if (configKey) {
                archivalContentTypeName = configKey.ArchivalContentTypeName.toLowerCase();
				archivalContentTypeName = archivalContentTypeName.split(";")
				clientContext = SP.ClientContext.get_current();
				currentWeb = clientContext.get_web();
				listCollection = currentWeb.get_lists();
				pagesList = currentWeb.get_lists().getByTitle(archiveLibraryName);
				this.contentTypeCollection = pagesList.get_contentTypes();
				clientContext.load(this.contentTypeCollection);

				clientContext.executeQueryAsync(
					Function.createDelegate(this, function() {
						contentTypeCount = 0;
						contentTypeEnumerator = this.contentTypeCollection.getEnumerator();
						while (contentTypeEnumerator.moveNext()) {
							getContentType = contentTypeEnumerator.get_current();
							contentTypeName = getContentType.get_name().toLowerCase();
							$.each(archivalContentTypeName, function(contentKey, contentVal) {
								if (contentVal.trim() === contentTypeName) {
									contentTypeCount += 1;
								}
							})
						}
						if (archivalContentTypeName.length === contentTypeCount) {
							deferred.resolve(true);
						} else {
							deferred.resolve(false);
							//alert("Required Content Types are missing from Pages Archive library");
						}
					}),
					Function.createDelegate(this, function(sender, args) {
						deferred.reject(sender, args);
					}));
            }else{
				deferred.reject(sender, args);
			}
        });
        return deferred.promise();

    }
    /*Returns information regarding wether currently selected file is checked out or not*/
    function checkFileStatus(selectedItemUrl) {
        var deferred = $.Deferred();

        $.ajax({
            type: 'POST',
            url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web/GetFileByServerRelativeUrl('" + selectedItemUrl + "')/checkOutType",
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $('#__REQUESTDIGEST').val()
            },
            success: function(data) {
                if (data.d.CheckOutType == 0) {
                    deferred.resolve(true);
                    //alert("Please check in this page for archiving");
                } else {
                    deferred.resolve(false);
                }
            },
            error: function() {
                deferred.reject(false);
            }
        });
        return deferred.promise();

    }

    function targetUrlExists(fullFolderUrl, archiveLibrary) {
        var clientContext, createFolderInternal;

        clientContext = SP.ClientContext.get_current();
        pagesList = clientContext.get_web().get_lists().getByTitle(archiveLibrary);

        createFolderInternal = function(pagesList, fullFolderUrl) {
            var context, folderNames, folderName, currentFolder;
            context = pagesList.get_context();
            folderNames = fullFolderUrl.split('/');
            folderNames = $.grep(folderNames, function(key, value) {
                return (key !== "" && key != null);
            });

            folderName = folderNames[0];
            currentFolder = pagesList.get_folders().add(folderName);
            context.load(currentFolder);
            context.executeQueryAsync(

                function() {
                    if (folderNames.length > 1) {
                        var subFolderUrl = folderNames.slice(1, folderNames.length).join('/');
                        createFolderInternal(currentFolder, subFolderUrl);
                    }

                },
                function() {
                    //alert('Failure in folder creation');
                });
        };
        createFolderInternal(pagesList.get_rootFolder(), fullFolderUrl);

    }

    function getSelectedFileProp(selectedItemId) {
        var deferred = $.Deferred();
        var clientContext, pagesList, clientWeb, selectedItem, fieldCollection;
        clientContext = SP.ClientContext.get_current();
        clientWeb = clientContext.get_web();
        pageList = clientWeb.get_lists().getByTitle("Pages");
        selectedItem = pageList.getItemById(selectedItemId);

        clientContext.load(selectedItem);

        clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                deferred.resolve(selectedItem);

            }),
            Function.createDelegate(this, function(sender, args) {
                console.log("Request failed: " + args.get_message() + "\n" + args.get_stackTrace());
                deferred.reject(args.get_message());
            }));

        return deferred.promise();

    }
    /*Get associated Page Layout information*/
    function getPageLayout(options) {
        var deferred = $.Deferred(),
            site, rootWeb, pageFromDocLayout, pageLayoutItem, clientContext, fileUrl;
        clientContext = SP.ClientContext.get_current();

        site = clientContext.get_site();
        rootWeb = site.get_rootWeb();
        clientContext.load(site);
        clientContext.load(rootWeb, "ServerRelativeUrl");

        clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                fileUrl = options.PublishingPageLayout.get_url();
                fileUrl = _spPageContextInfo.siteServerRelativeUrl + fileUrl.replace(_spPageContextInfo.siteAbsoluteUrl, "");
                pageFromDocLayout = rootWeb.getFileByServerRelativeUrl(fileUrl);
                pageLayoutItem = pageFromDocLayout.get_listItemAllFields();
                clientContext.load(pageLayoutItem);
                clientContext.load(pageLayoutItem, "DisplayName");
                clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                        deferred.resolve({
                            PageLayoutObject: pageLayoutItem,
                            ClientContext: clientContext
                        });
                    }),
                    Function.createDelegate(this, function(sender, args) {
                        console.log("Request failed: " + args.get_message() + "\n" + args.get_stackTrace());
                        deferred.reject(args.get_message());
                    }));
            }),
            Function.createDelegate(this, function(sender, args) {
                console.log("Get Layout Request failed: " + args.get_message() + "\n" + args.get_stackTrace());
                deferred.reject(args.get_message());
            }));

        return deferred.promise();

    }
    /*Creating page in pages archival library*/
    function createPublishingPage(fields, archiveLibraryUrl, pageLayoutInfo) {
        var deferred = $.Deferred(),
            pageInfo, newPage, clientContext, clientWeb, pubWeb, resultantTitle,
            folder, filePath, listItem, listItemUrl, titleWithTimestamp, filesDetail, filesDetailEnum, currentFile;

        clientContext = pageLayoutInfo.ClientContext;
        clientWeb = clientContext.get_web();
        pubWeb = SP.Publishing.PublishingWeb.getPublishingWeb(clientContext, clientWeb);
        clientContext.load(clientWeb);
        clientContext.load(pubWeb);
        clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
            titleWithTimestamp = fields.Title + "_" + $.now() + ".aspx";
            titleWithOutTimeStamp = fields.Title + ".aspx";
            resultantTitle = titleWithOutTimeStamp;
            folder = clientWeb.getFolderByServerRelativeUrl(archiveLibraryUrl);
            filesDetail = folder.get_files();
            clientContext.load(filesDetail);
            clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                    filesDetailEnum = filesDetail.getEnumerator();
                    while (filesDetailEnum.moveNext()) {
                        currentFile = filesDetailEnum.get_current();
                        if (currentFile.get_name() === titleWithOutTimeStamp) {
                            resultantTitle = titleWithTimestamp;
                            break;
                        }

                    }
                    pageInfo = new SP.Publishing.PublishingPageInformation();
                    pageInfo.set_folder(folder);
                    pageInfo.set_pageLayoutListItem(pageLayoutInfo.PageLayoutObject);
                    pageInfo.set_name(resultantTitle);
                    newPage = pubWeb.addPublishingPage(pageInfo);
                    clientContext.load(newPage);
                    clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                            listItemUrl = clientWeb.getFileByServerRelativeUrl(archiveLibraryUrl + "/" + resultantTitle);
                            listItem = listItemUrl.get_listItemAllFields();
                            clientContext.load(listItemUrl);
                            clientContext.load(listItem);
                            clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                                    deferred.resolve({
                                        ListItemID: listItem.get_id(),
                                        ResultantTitle: resultantTitle
                                    });
                                }),
                                Function.createDelegate(this, function(sender, args) {
                                    console.log("Create Page Load Item failed: " + args.get_message() + "\n" + args.get_stackTrace());
                                    deferred.reject(args.get_message());
                                }));
                        }),
                        Function.createDelegate(this, function(sender, args) {
                            console.log("Create Page Request failed: " + args.get_message() + "\n" + args.get_stackTrace());
                            deferred.reject(args.get_message());
                        }));
                }),
                Function.createDelegate(this, function(sender, args) {
                    console.log("Failed to get files information " + args.get_message() + "\n" + args.get_stackTrace());
                    deferred.reject(args.get_message());
                }));

        }));
        return deferred.promise();

    }
    /*Pushing values into multi value taxonomy filed*/
    function getMultiTax(getTaxonomyField) {
        var taxonomyFields = new Array();
        while (getTaxonomyField.moveNext()) {
            var getItem = getTaxonomyField.get_current();
            if (getItem) {
                taxonomyFields.push("-1;#" + getItem.get_label() + "|" + getItem.get_termGuid());
            }
        }
        return taxonomyFields.join(";#");
    }
    /*Updating authoring page fields after Archival*/
    function updatePageFields(selectedItem, resultantData, archiveLibraryName, folderPath) {
        var clientContext, pagesList, clientWeb, listItem, fieldCollection, deferred;
        deferred = $.Deferred();
        clientContext = SP.ClientContext.get_current();
        clientWeb = clientContext.get_web();
        pageList = clientWeb.get_lists().getByTitle(archiveLibraryName);
        clientContext.load(pageList);
        fieldCollection = pageList.get_fields();
        clientContext.load(fieldCollection);
        listItem = pageList.getItemById(resultantData.ListItemID);
        clientContext.load(listItem);

        clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                var fieldEnumerator = fieldCollection.getEnumerator();
                while (fieldEnumerator.moveNext()) {
                    var oField = fieldEnumerator.get_current();
                    var oFieldInternalName = oField.get_internalName();
                    if (oField && oFieldInternalName && oFieldInternalName.startsWith("Core_")) {
                        if (oField.get_typeDisplayName() === "Managed Metadata") {
                            var sourceVal;
                            /*Taxonomy field Type Multi*/
                            if (oField.get_typeAsString() === "TaxonomyFieldTypeMulti") {
                                var fieldByInternalName, taxField, getTaxonomyFieldColl, getTaxonomyField, allTaxTerms;
                                fieldByInternalName = pageList.get_fields().getByInternalNameOrTitle(oFieldInternalName);
                                taxField = clientContext.castTo(fieldByInternalName, SP.Taxonomy.TaxonomyField);
                                getTaxonomyFieldColl = selectedItem.get_item(oField.get_internalName());
                                if (getTaxonomyFieldColl.getItemAtIndex(0)) {
                                    getTaxonomyField = getTaxonomyFieldColl.getEnumerator();
                                    allTaxTerms = new SP.Taxonomy.TaxonomyFieldValueCollection(clientContext, getMultiTax(getTaxonomyField), taxField);
                                    taxField.setFieldValueByValueCollection(listItem, allTaxTerms);
                                }
                            }
                            /*Taxonomy Field type single*/
                            else if (oField.get_typeAsString() === "TaxonomyFieldType") {
                                var getItem, getTermGuid, getTaxonomyField;
                                sourceVal = null;
                                getTaxonomyField = selectedItem.get_item(oField.get_internalName());
                                if (getItem && getTaxonomyField !== null) {
                                    getTermGuid = getTaxonomyField.get_termGuid();
                                    sourceVal = getTermGuid;
                                    if (sourceVal != null) {
                                        listItem.set_item(oField.get_internalName(), sourceVal);
                                    }
                                }
                            }
                        }
                        /*Non-managed metadata condition*/
                        else {
                            var getItem, sourceVal = null;
                            sourceVal = selectedItem.get_item(oField.get_internalName());
                            if (sourceVal != null) {
                                listItem.set_item(oField.get_internalName(), sourceVal);
                            }
                        }
                    }
                    if (oFieldInternalName === "Title") {
                        var sourceVal = selectedItem.get_item(oField.get_internalName());
                        if (sourceVal != null) {
                            listItem.set_item(oField.get_internalName(), sourceVal);
                        }

                    }
                }
                listItem.update();
                clientContext.load(taxField);
                clientContext.load(listItem);
                clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                /*Close Modal box of File cuurent status check*/
                         SP.UI.ModalDialog.commonModalDialogClose(); 
    					 openModalDialog("Successfully Archived...","Page has been successfully archived. Please copy new URL for the page " + _spPageContextInfo.webAbsoluteUrl + "/" + folderPath + "/" + resultantData.ResultantTitle);
						 deferred.resolve(true);
                    }),
                    Function.createDelegate(this, function(sender, args) {
                        console.log("Set page fields Request failed: " + args.get_message() + "\n" + args.get_stackTrace());
                        deferred.reject(args.get_message());
                    }));
            }),
            Function.createDelegate(this, function(sender, args) {
                //alert('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
                deferred.reject(args.get_message());
            }));

        return deferred.promise();
    }

    /*Deleting Page present in pages library*/
    function deletePublishingPage(selectedItemId) {
        var clientContext, fieldValues, listItem, pagesList, clientWeb;
        clientContext = SP.ClientContext.get_current();
        clientWeb = clientContext.get_web();
        pagesList = clientWeb.get_lists().getByTitle('Pages');
        listItem = pagesList.getItemById(selectedItemId);
        clientContext.load(listItem);
        listItem.deleteObject();
        pagesList.update();
        clientContext.load(pagesList);
        clientContext.executeQueryAsync(Function.createDelegate(this, function(sender, args) {
                //alert("Selected page has been successfully deleted from this library");
                location.reload();
            }),
            Function.createDelegate(this, function(sender, args) {
                console.log("Delete List Item Request failed: " + args.get_message() + "\n" + args.get_stackTrace());
            }));

    }

	 /*Open Modal Dialog with close*/
	function openModalDialog(titletext,htmltext) {
	var dialogHtml;
	
		dialogHtml = "<div id='custom-dialog' class='ms-textXLarge ms-alignCenter'>"+htmltext+"</div>";
		$('body').append(dialogHtml);
		
		SP.UI.ModalDialog.showModalDialog({
		title:titletext,
		html: document.getElementById('custom-dialog'),
		allowMaximize: false,
		showClose: true,
		autoSize: true
		});
		$("#dialogTitleSpan").addClass('custom-dialog-title');
	}
    SamplePageComponent = function() {
        SamplePageComponent.initializeBase(this);
    }

    SamplePageComponent.initializePageComponent = function() {
        var ribbonPageManager, rbnInstance;
        ribbonPageManager = SP.Ribbon.PageManager.get_instance();
        if (null !== ribbonPageManager) {
            rbnInstance = SamplePageComponent.get_instance();
            ribbonPageManager.addPageComponent(rbnInstance);
        }
    }

    SamplePageComponent.get_instance = function() {
        if (SamplePageComponent.instance == null || SamplePageComponent.instance === undefined) {
            SamplePageComponent.instance = new SamplePageComponent();
        }
        return SamplePageComponent.instance;
    }

    SamplePageComponent.prototype = {
        /* Create an array of handled commands with handler methods */

        init: function(buttonState) {
            var buttonEnabled = false;
			this.toggleStatusChecked = false;
			this.isOn = false;
            this.buttonEnableCheck = false;
            this.handledCommands = new Object();
            this.handledCommands['Custom.Group.Command'] = {
				
                enable: function() {
					this.toggleStatusChecked = true;
					deferred = $.Deferred();
					deferred.resolve(true);
                    return deferred.promise();
                },
                handle: function(commandId, props, seq) {}
            };
            this.handledCommands['Custom.Button.Command'] = {
                enable: function (commandId, properties, sequence){
                	this.toggleStatusChecked = true;
                    var selectedItem, 
						deferred = $.Deferred();						
                    this.buttonEnableCheck = true;
                    selectedItem = SP.ListOperation.Selection.getSelectedItems(SP.ClientContext.get_current());
                    if (selectedItem.length === 1) {
                        if (selectedItem[0].fsObjType === "0") {
							nexGen.services.applicationConfigPromise.then(function(configKey) {
								var archiveLibraryName;
								if (configKey) {
									archiveLibraryName = configKey.ArchiveLibrary;
									contentTypeExitInTarget(archiveLibraryName).then(function(contentTypeStatus) {
										if(false &&contentTypeStatus){
											deferred.resolve(true);
										}else{
											deferred.resolve(false);
										}
									});								
								}else{
		                        	deferred.resolve(false);
		                        }
							});
                        }else{
                        	deferred.resolve(false);
                        }
                    } else {
                        deferred.resolve(false);
                    }
                    return deferred.promise();
                },

                handle: function(commandId, props, seq) {

                    var selectedItemData, selectedItemId, selectedItemName, archiveLibraryName,
                        archiveLibraryUrl;

                    nexGen.services.applicationConfigPromise.then(function(configKey) {
                        if (configKey) {
                            archiveLibraryName = configKey.ArchiveLibrary;
                        }
                    });

                    selectedItemData = SP.ListOperation.Selection.getSelectedItems(SP.ClientContext.get_current());
                    selectedItemId = selectedItemData[0].id;

                    archiveLibraryUrl = _spPageContextInfo.webServerRelativeUrl + "/" + archiveLibraryName;
                    if (confirm("Would you like to start page archival process?")) {
                        targetLibExist(archiveLibraryUrl).then(function(targetLibStatus) {
                            if (targetLibStatus) {
                                SP.UI.ModalDialog.showWaitScreenWithNoClose("Page Archival...", "Page Archival process has initiated", 150, 360);
                                contentTypeExitInTarget(archiveLibraryName).then(function(contentTypeStatus) {
                                    /*Close Modal Dialog box of target library existing message box*/
                                    SP.UI.ModalDialog.commonModalDialogClose();
                                    if (contentTypeStatus) {
                                        SP.UI.ModalDialog.showWaitScreenWithNoClose("Page Archival...", "Page Archival process has initiated", 150, 360);
                                        GetName(selectedItemId).then(function(selectedItemUrl) {
                                            var folderPath, fileNameIndex;
                                            selectedItemName = selectedItemUrl.split('/').pop();
                                            folderPath = selectedItemUrl.split("Pages/")[1];
                                            fileNameIndex = folderPath.lastIndexOf('/');
                                            folderPath = folderPath.substring(0, fileNameIndex);
                                            archiveLibraryUrl += "/" + folderPath;
                                            if (folderPath.length > 0) {
                                                targetUrlExists(folderPath, archiveLibraryName);
                                            }
                                            checkFileStatus(selectedItemUrl).then(function(fileStatus) {
                                                /*Close Modal Dialog box of content type status check*/
                                                SP.UI.ModalDialog.commonModalDialogClose();
                                                if (!fileStatus) {
                                                    SP.UI.ModalDialog.showWaitScreenWithNoClose("Page Archival...", "Page Archival process has initiated", 150, 360);
                                                    getSelectedFileProp(selectedItemId).then(function(selectedItem) {
                                                        getPageLayout(selectedItem.get_fieldValues()).then(function(response) {
                                                            createPublishingPage(selectedItem.get_fieldValues(), archiveLibraryUrl, response).then(function(resultantData) {
                                                            	
                                                                updatePageFields(selectedItem, resultantData, archiveLibraryName, folderPath).then(function(updationStatus) {
                                                                    if (updationStatus) {
                                                                        // deletePublishingPage(selectedItemId);
                                                                       // SP.UI.ModalDialog.commonModalDialogClose();

                                                                    }
                                                                }).fail(function(error) {
                                                                    SP.UI.ModalDialog.commonModalDialogClose();
                                                                });

                                                            }).fail(function(error) {
                                                                SP.UI.ModalDialog.commonModalDialogClose();
                                                            });

                                                        }).fail(function(error) {
                                                            SP.UI.ModalDialog.commonModalDialogClose();
                                                        });

                                                    }).fail(function(error) {
                                                        SP.UI.ModalDialog.commonModalDialogClose();
                                                    });

                                                } else {
                                                    SP.UI.ModalDialog.commonModalDialogClose();
                                                }
                                            }).fail(function(error) {
                                                SP.UI.ModalDialog.commonModalDialogClose();
                                            });
                                        });
                                    } else {
                                        SP.UI.ModalDialog.commonModalDialogClose();
                                    }
                                }).fail(function(error) {
                                    SP.UI.ModalDialog.commonModalDialogClose();
                                });
                            } else {
                                SP.UI.ModalDialog.commonModalDialogClose();
                            }
                        }).fail(function(error) {
                            SP.UI.ModalDialog.commonModalDialogClose();
                        });
                    }
                }

            };

            this.commands = ['Custom.Group.Command', 'Custom.Button.Command'];

        },

        getFocusedCommands: function() {
            return [];
        },
        getGlobalCommands: function() {
            return this.commands;
        },
        canHandleCommand: function(commandId) {
			var toggleStatusChecked = this.toggleStatusChecked; 
			if(commandId === 'Custom.Button.Command' || commandId === 'Custom.Group.Command'){
				this.handledCommands[commandId].enable().then(function(buttonState){
					if(!toggleStatusChecked){
						toggleStatusChecked = true;
						this.isOn = buttonState;
						RefreshCommandUI();
					}
				});
			}
			else {
				return false;
			}
        },
        handleCommand: function(commandId, properties, sequence) {
            this.handledCommands[commandId].handle(commandId, properties, sequence);
        },
        isFocusable: function() {
            return true;
        },
        yieldFocus: function() {
            return false;
        },
        receiveFocus: function() {
            return true;
        },
        handleGroup: function() {}

    }

    /* Register classes and initialize page component */
    SamplePageComponent.registerClass('SamplePageComponent', CUI.Page.PageComponent);
    NotifyScriptLoadedAndExecuteWaitingJobs('ribbon.js');
}