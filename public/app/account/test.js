Type.registerNamespace('Mavention.SharePoint.Labs.MyCustomAction.PageComponent');

Mavention.SharePoint.Labs.MyCustomAction.PageComponent = function () {  
    Mavention.SharePoint.Labs.MyCustomAction.PageComponent.initializeBase(this);
}

Mavention.SharePoint.Labs.MyCustomAction.PageComponent.initialize = function () {  
    SP.SOD.executeOrDelayUntilScriptLoaded(Function.createDelegate(null, Mavention.SharePoint.Labs.MyCustomAction.PageComponent.initializePageComponent), 'SP.Ribbon.js');
}

Mavention.SharePoint.Labs.MyCustomAction.PageComponent.initializePageComponent = function () {  
    var ribbonPageManager = SP.Ribbon.PageManager.get_instance();
    if (null !== ribbonPageManager) {
        ribbonPageManager.addPageComponent(Mavention.SharePoint.Labs.MyCustomAction.PageComponent.instance);
    }
}

Mavention.SharePoint.Labs.MyCustomAction.PageComponent.prototype = {  
    init: function () {
        this.toggleStatusChecked = false;
        this.isOn = false;
    },
    getFocusedCommands: function () {
        return [];
    },
    getGlobalCommands: function () {
        return ['Custom.Group.Command', 'Custom.Button.Command'];
    },
    canHandleCommand: function (commandId) {
        if (commandId === 'Mavention.SharePoint.Labs.MyCustomAction' ||
            commandId === 'Mavention.SharePoint.Labs.MyCustomActionQuery') {
            return true;
        }
        else {
            return false;
        }
    },
    handleCommand: function (commandId, properties, sequence) {
        if (commandId === 'Mavention.SharePoint.Labs.MyCustomActionQuery') {
            if (!this.toggleStatusChecked) {
                this.checkIsOn();
            }

            properties.On = this.isOn;
        }
    },
    isFocusable: function () {
        return true;
    },
    receiveFocus: function () {
        return true;
    },
    yieldFocus: function () {
        return true;
    },
    checkIsOn: function () {
        this.toggleStatusChecked = true;

        var context = SP.ClientContext.get_current();
        var properties = context.get_web().get_allProperties();
        context.load(properties);
        context.executeQueryAsync(Function.createDelegate(this, function () {
            this.isOn = properties.get_item('MaventionMyProperty') == 1;
            RefreshCommandUI();
        }), Function.createDelegate(this, function () {
            // handle error
        }));
    }
}

Mavention.SharePoint.Labs.MyCustomAction.PageComponent.registerClass('Mavention.SharePoint.Labs.MyCustomAction.PageComponent', CUI.Page.PageComponent);  
Mavention.SharePoint.Labs.MyCustomAction.PageComponent.instance = new Mavention.SharePoint.Labs.MyCustomAction.PageComponent();

SP.SOD.notifyScriptLoadedAndExecuteWaitingJobs('mavention.sharepoint.labs.mycustomaction.pagecomponent.js');  
Once again the biggest part of the script is respon