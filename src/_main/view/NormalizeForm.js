Ext.define('PumaMain.view.NormalizeForm', {
    extend: 'Ext.form.Panel',
    alias: 'widget.normalizeform',
    frame: true,
    initComponent: function() {
        this.attrStore = Ext.create('Gisatlib.data.SlaveStore',{
            slave: true,
            autoLoad: true,
            filters: [function(rec) {
                    return false;
            }],
            model: 'Puma.model.Attribute'
        })
        this.bodyStyle = {
            padding: '0px'
        };

		this.items = [{
			xtype: 'pumacombo',
			store: Ext.StoreMgr.lookup(this.formType == 'chart' ? 'normalization4chart' : 'normalization4chartlimited'),
			fieldLabel: 'Norm type',
			name: 'normType',
			valueField: 'type',
			itemId: 'normType'
		}, {
			xtype: 'pumacombo',
			store: Ext.StoreMgr.lookup('attributeset2choose'),
			fieldLabel: 'Normalization Attr set',
			name: 'normAttributeSet',
			hidden: true,
			itemId: 'normAttributeSet'
		}, {
			xtype: 'pumacombo',
			store: this.attrStore,
			fieldLabel: 'Normalization Attribute',
			name: 'normAttribute',
			hidden: true,
			itemId: 'normAttribute'
		}, {
			xtype: 'pumacombo',
			store: Ext.StoreMgr.lookup('normalization_units'),
			fieldLabel: 'Normalization Units',
			name: 'normalizationUnits',
			valueField: 'type',
			itemId: 'normalizationUnits'
		}, {
			xtype: 'pumacombo',
			hidden: true,
			store: Ext.StoreMgr.lookup('year4sel'),
			fieldLabel: 'Normalization year',
			name: 'normYear',
			itemId: 'normYear'
		}];

        this.buttons = [{
                text: 'Change normalization',
                itemId: 'normalize'
            }, {
                text: 'Remove normalization',
                itemId: 'dontnormalize'
            }, {
                text: 'Back',
                itemId: 'back'
            }]
        this.callParent();

    }
})


