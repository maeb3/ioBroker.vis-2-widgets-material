import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import { CircularSliderWithChildren } from 'react-circular-slider-svg';

import {
    Button, Dialog, DialogContent, DialogTitle, IconButton, Tooltip,
} from '@mui/material';

// import { FormControl, InputLabel, MenuItem, Select, Tab, Tabs, TextField } from '@mui/material';

import {
    WbSunny as WbSunnyIcon,
    PowerSettingsNew as PowerSettingsNewIcon,
    Air as AirIcon,
    ThermostatAuto as ThermostatAutoIcon,
    PanTool as PanToolIcon,
    AcUnit as AcUnitIcon,
    Dry as DryIcon,
    Park as ParkIcon,
    Houseboat as HouseboatIcon,
    MoreVert as MoreVertIcon,
    Close as IconClose,
} from '@mui/icons-material';

import ObjectChart from './ObjectChart';
import Generic from './Generic';

const Buttons = {
    AUTO: ThermostatAutoIcon,
    MANUAL: PanToolIcon,
    VACATION: HouseboatIcon,
    COOL: AcUnitIcon,
    DRY: DryIcon,
    ECO: ParkIcon,
    FAN_ONLY: AirIcon,
    HEAT: WbSunnyIcon,
    OFF: PowerSettingsNewIcon,
};

const styles = () => ({
    circleDiv: {
        width: '100%',
        height: '100%',
        '& svg circle': {
            cursor: 'pointer',
        },
        '&>div': {
            margin: 'auto',
            '&>div': {
                transform: 'translate(-40%, -50%) !important',
                top: '45% !important',
            },
        },
    },
    moreButton: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    buttonsDiv: {
        textAlign: 'center',
    },
    newValueLight: {
        animation: '$newValueAnimationLight 2s ease-in-out',
    },
    '@keyframes newValueAnimationLight': {
        '0%': {
            color: '#00bd00',
        },
        '80%': {
            color: '#008000',
        },
        '100%': {
            color: '#000',
        },
    },
    newValueDark: {
        animation: '$newValueAnimationDark 2s ease-in-out',
    },
    '@keyframes newValueAnimationDark': {
        '0%': {
            color: '#008000',
        },
        '80%': {
            color: '#00bd00',
        },
        '100%': {
            color: '#ffffff',
        },
    },
});

class Thermostat extends Generic {
    constructor(props) {
        super(props);
        this.state.showDialog = false;
        this.state.dialogTab = 1;
        this.state.size = 0;
        this.refContainer = React.createRef();
    }

    static getWidgetInfo() {
        return {
            id: 'tplMaterial2Thermostat',
            visSet: 'vis-2-widgets-material',
            visWidgetLabel: 'thermostat',  // Label of widget
            visName: 'Thermostat',
            visAttrs: [{
                name: 'common',
                fields: [
                    {
                        name: 'name',
                        label: 'name',
                    },
                    {
                        name: 'oid-temp-set',
                        type: 'id',
                        label: 'temperature_oid',
                    },
                    {
                        name: 'oid-temp-actual',
                        type: 'id',
                        label: 'actual_oid',
                    },
                    {
                        name: 'oid-power',
                        type: 'id',
                        label: 'power_oid',
                    },
                    {
                        name: 'oid-mode',
                        type: 'id',
                        label: 'mode_oid',
                    },
                    {
                        name: 'oid-step',
                        type: 'select',
                        disabled: '!data["oid-temp-set"]',
                        label: 'step',
                        options: ['0.5', '1'],
                        default: '1',
                    },
                ],
            }],
            visDefaultStyle: {
                width: '100%',
                height: 120,
                position: 'relative',
            },
            visPrev: 'widgets/vis-2-widgets-material/img/prev_thermostat.png',
        };
    }

    async propertiesUpdate() {
        const actualRxData = JSON.stringify(this.state.rxData);
        if (this.lastRxData === actualRxData) {
            return;
        }

        const newState = {};
        this.lastRxData = actualRxData;

        if (this.state.rxData['oid-mode'] && this.state.rxData['oid-mode'] !== 'nothing_selected') {
            const modeObj = await this.props.socket.getObject(this.state.rxData['oid-mode']);
            newState.modes = modeObj?.common?.states;
            newState.modeObject = { common: modeObj.common, _id: modeObj._id };
            if (Array.isArray(newState.modes)) {
                const result = {};
                newState.modes.forEach(m => result[m] = m);
                newState.modes = result;
            }
        } else {
            newState.modes = null;
            newState.mode = null;
        }

        if (this.state.rxData['oid-temp-set'] && this.state.rxData['oid-temp-set'] !== 'nothing_selected') {
            const tempObj = await this.props.socket.getObject(this.state.rxData['oid-temp-set']);
            newState.min = tempObj?.common?.min === undefined ? 12 : tempObj.common.min;
            newState.max = tempObj?.common?.max === undefined ? 30 : tempObj.common.max;
            newState.tempObject = { common: tempObj.common, _id: tempObj._id };
        } else {
            newState.tempObject = null;
            newState.temp = null;
            newState.max = null;
            newState.min = null;
        }

        if (this.state.rxData['oid-temp-actual'] && this.state.rxData['oid-temp-actual'] !== 'nothing_selected') {
            const tempStateObj = await this.props.socket.getObject(this.state.rxData['oid-temp-actual']);
            newState.tempStateObject = { common: tempStateObj.common, _id: tempStateObj._id };
        } else {
            newState.tempStateObject = null;
        }

        newState.isChart = (newState.tempObject?.common?.custom && newState.tempObject.common.custom[this.props.systemConfig.common.defaultHistory]) ||
            (newState.tempStateObject?.common?.custom && newState.tempStateObject.common.custom[this.props.systemConfig.common.defaultHistory]);

        Object.keys(newState).find(key => JSON.stringify(this.state[key]) !== JSON.stringify(newState[key])) && this.setState(newState);
    }

    async componentDidMount() {
        super.componentDidMount();
        await this.propertiesUpdate();
    }

    async onRxDataChanged() {
        await this.propertiesUpdate();
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo() {
        return Thermostat.getWidgetInfo();
    }

    formatValue(value, round) {
        if (typeof value === 'number') {
            if (round === 0) {
                value = Math.round(value);
            } else {
                value = Math.round(value * 100) / 100;
            }
            if (this.props.systemConfig?.common) {
                if (this.props.systemConfig.common.isFloatComma) {
                    value = value.toString().replace('.', ',');
                }
            }
        }

        return value === undefined || value === null ? '' : value.toString();
    }

    renderDialog() {
        if (!this.state.showDialog) {
            return null;
        }
        return <Dialog
            sx={{ '& .MuiDialog-paper': { height: '100%' } }}
            maxWidth="lg"
            fullWidth
            open={!0}
            onClose={() => this.setState({ showDialog: false })}
        >
            <DialogTitle>
                {this.state.rxData.name}
                <IconButton style={{ float: 'right' }} onClick={() => this.setState({ showDialog: false })}><IconClose /></IconButton>
            </DialogTitle>
            <DialogContent>
                {/* <Tabs value={this.state.dialogTab} onChange={(e, value) => this.setState({ dialogTab: value })}>
                    <Tab label={Generic.t('Properties')} value={0} />
                    <Tab label={Generic.t('History')} value={1} />
                </Tabs>
                {this.state.dialogTab === 0 && <div>
                    <TextField
                        fullWidth
                        value={this.state.temp || null}
                        onChange={e => {
                            this.setState({ temp: Math.round(e.target.value) });
                            this.props.socket.setState(this.state.rxData['oid-temp-set'], Math.round(e.target.value));
                        }}
                        variant="standard"
                        type="number"
                        inputProps={{
                            min: this.state.min,
                            max: this.state.max,
                        }}
                        label={Generic.t('Temperature')}
                    />
                    <FormControl fullWidth variant="standard">
                        <InputLabel>{Generic.t('Mode')}</InputLabel>
                        <Select
                            value={this.state.mode}
                            onChange={e => {
                                this.setState({ mode: parseInt(e.target.value) });
                                this.props.socket.setState(this.state.rxData['oid-mode'], parseInt(e.target.value));
                            }}
                        >
                            {this.state.modes ? Object.keys(this.state.modes).map(modeIndex => {
                                const mode = this.state.modes[modeIndex];
                                return <MenuItem key={modeIndex} value={modeIndex}>{Generic.t(mode)}</MenuItem>;
                            }) : null}
                        </Select>
                    </FormControl>
                </div> */}
                {this.state.dialogTab === 1 && <div style={{ height: '100%' }}>
                    <ObjectChart
                        t={Generic.t}
                        lang={Generic.getLanguage()}
                        socket={this.props.socket}
                        obj={this.state.tempStateObject || this.state.tempObject}
                        obj2={!this.state.tempStateObject ? null : this.state.tempObject}
                        objLineType={this.state.tempStateObject ? 'line' : 'step'}
                        obj2LineType="step"
                        themeType={this.props.themeType}
                        defaultHistory={this.props.systemConfig?.common?.defaultHistory || 'history.0'}
                        noToolbar={false}
                        systemConfig={this.props.systemConfig}
                        dateFormat={this.props.systemConfig.common.dateFormat}
                    />
                </div>}
            </DialogContent>
        </Dialog>;
    }

    componentDidUpdate() {
        if (super.componentDidUpdate) {
            super.componentDidUpdate();
        }
        if (this.refContainer.current) {
            let size = this.refContainer.current.clientWidth;
            if (size > this.refContainer.current.clientHeight) {
                size = this.refContainer.current.clientHeight;
            }
            if (this.state.rxData.name) {
                size -= 64; // header
            }
            size -= 20; // mode buttons

            if (size !== this.state.width) {
                this.setState({ width: size });
            }
        }
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const actualRxData = JSON.stringify(this.state.rxData);
        if (this.lastRxData !== actualRxData) {
            this.updateTimeout = this.updateTimeout || setTimeout(async () => {
                this.updateTimeout = null;
                await this.propertiesUpdate();
            }, 50);
        }

        let tempValue = this.state.values[`${this.state.rxData['oid-temp-set']}.val`];
        if (tempValue === undefined) {
            tempValue = null;
        }
        if (tempValue !== null && tempValue < this.state.min) {
            tempValue = this.state.min;
        } else
        if (tempValue !== null && tempValue > this.state.max) {
            tempValue = this.state.max;
        }

        if (tempValue === null) {
            tempValue = (this.state.max - this.state.min) / 2 + this.state.min;
        }

        let actualTemp = this.state.values[`${this.state.rxData['oid-temp-actual']}.val`];
        if (actualTemp === undefined) {
            actualTemp = null;
        }

        let handleSize = Math.round(this.state.width / 25);
        if (handleSize < 8) {
            handleSize = 8;
        }

        // console.log(this.state.min, this.state.max, tempValue);

        const chartButton = this.state.isChart ? <IconButton
            className={this.state.rxData.name ? '' : this.props.classes.moreButton}
            onClick={() => this.setState({ showDialog: true })}
        >
            <MoreVertIcon />
        </IconButton> : null;

        actualTemp = actualTemp !== null ? this.formatValue(actualTemp) : null;

        const content = <div ref={this.refContainer} style={{ width: '100%', height: '100%' }} className={this.props.classes.circleDiv}>
            {this.state.rxData.name ? null : chartButton}
            {this.state.width && this.state.tempObject ?
                <CircularSliderWithChildren
                    minValue={this.state.min}
                    maxValue={this.state.max}
                    size={this.state.width}
                    arcColor={this.props.themeType === 'dark' ? '#fff' : '#000'}
                    startAngle={40}
                    step={0.5}
                    handleSize={handleSize}
                    endAngle={320}
                    handle1={{
                        value: tempValue,
                        onChange: value => {
                            const values = JSON.parse(JSON.stringify(this.state.values));
                            if (this.state.rxData['oid-step'] === '0.5') {
                                values[`${this.state.rxData['oid-temp-set']}.val`] = Math.round(value * 2) / 2;
                            } else {
                                values[`${this.state.rxData['oid-temp-set']}.val`] = Math.round(value);
                            }
                            this.setState({ values });
                        },
                    }}
                    onControlFinished={() =>
                        this.props.socket.setState(this.state.rxData['oid-temp-set'], this.state.values[`${this.state.rxData['oid-temp-set']}.val`])}
                >
                    {tempValue !== null ? <Tooltip title={Generic.t('desired_temperature')}>
                        <div
                            style={{ fontSize: Math.round(this.state.width / 10), fontWeight: 'bold' }}
                        >
                            {this.formatValue(tempValue)}
                            {this.state.tempObject?.common?.unit}
                        </div>
                    </Tooltip> : null}
                    {actualTemp !== null ? <Tooltip title={Generic.t('actual_temperature')}>
                        <div
                            style={{ fontSize: Math.round((this.state.width * 0.6) / 10) }}
                            key={`${actualTemp}valText`}
                            className={this.props.themeType === 'dark' ? this.props.classes.newValueDark : this.props.classes.newValueLight}
                        >
                            {actualTemp}
                            {this.state.tempStateObject?.common?.unit}
                        </div>
                    </Tooltip> : null}
                </CircularSliderWithChildren>
                : null}
            <div className={this.props.classes.buttonsDiv}>
                {this.state.modes && (!this.state.rxData['oid-power'] || this.state.values[`${this.state.rxData['oid-power']}.val`]) ?
                    Object.keys(this.state.modes).map((modeIndex, i) => {
                        const mode = this.state.modes[modeIndex];
                        const MyButtonIcon = Buttons[mode] || null;
                        let currentValueStr = this.state.values[`${this.state.rxData['oid-mode']}.val`];
                        if (currentValueStr === null || currentValueStr === undefined) {
                            currentValueStr = 'null';
                        } else {
                            currentValueStr = currentValueStr.toString();
                        }

                        return MyButtonIcon ?
                            <Tooltip key={i} title={Generic.t(mode).replace('vis_2_widgets_material_', '')}>
                                <IconButton
                                    color={currentValueStr === modeIndex ? 'primary' : 'grey'}
                                    onClick={() => {
                                        let value = modeIndex;
                                        if (this.state.modeObject?.common?.type === 'number') {
                                            value = parseFloat(value);
                                        }
                                        const values = JSON.parse(JSON.stringify(this.state.values));
                                        values[`${this.state.rxData['oid-mode']}.val`] = value;
                                        this.setState(values);
                                        this.props.socket.setState(this.state.rxData['oid-mode'], value);
                                    }}
                                >
                                    <MyButtonIcon />
                                </IconButton>
                            </Tooltip>
                            :
                            <Button
                                key={i}
                                color={currentValueStr === modeIndex ? 'primary' : 'grey'}
                                onClick={() => {
                                    let value = modeIndex;
                                    if (this.state.modeObject?.common?.type === 'number') {
                                        value = parseFloat(value);
                                    }
                                    const values = JSON.parse(JSON.stringify(this.state.values));
                                    values[`${this.state.rxData['oid-mode']}.val`] = value;
                                    this.setState(values);
                                    this.props.socket.setState(this.state.rxData['oid-mode'], value);
                                }}
                            >
                                {this.state.modes[modeIndex]}
                            </Button>;
                    }) : null}
                {this.state.rxData['oid-power'] && this.state.rxData['oid-power'] !== 'nothing_selected' ?
                    <Tooltip title={Generic.t('power').replace('vis_2_widgets_material_', '')}>
                        <IconButton
                            color={this.state.values[`${this.state.rxData['oid-power']}.val`] ? 'primary' : 'grey'}
                            onClick={() => {
                                const values = JSON.parse(JSON.stringify(this.state.values));
                                const id = `${this.state.rxData['oid-power']}.val`;
                                values[id] = !values[id];
                                this.setState(values);
                                this.props.socket.setState(this.state.rxData['oid-power'], values[id]);
                            }}
                        >
                            <PowerSettingsNewIcon />
                        </IconButton>
                    </Tooltip> : null}
            </div>
            {this.renderDialog()}
        </div>;

        return this.wrapContent(content, this.state.rxData.name ? chartButton : null, { textAlign: 'center' });
    }
}

Thermostat.propTypes = {
    systemConfig: PropTypes.object,
    socket: PropTypes.object,
    themeType: PropTypes.string,
    style: PropTypes.object,
    data: PropTypes.object,
};

export default withStyles(styles)(Thermostat);
