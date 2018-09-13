import {connectAdvanced} from "react-redux";
import shallowEqual from "./shallow-equal";
import {Dispatch, AnyAction} from "redux";
import {StatelessComponent, ReactNode} from "react";

interface InternalProps {
    mappedState: any;
    mappedActions: any;
    render: Function;
}

/**
 * Throw in mapState to force null rendering.
 * 
 * Experimental API. Do not use.
 */
export class RenderNull extends Error {
    isRenderNull: boolean;

    constructor() {
        super("Render null");
        this.isRenderNull = true;
    }
}

function isRenderNull(o: any): o is RenderNull {
    return o && o.isRenderNull;
}

const reduxRenderPropRender = (props: InternalProps) => {
    if (props.mappedState.__renderNull) {
        return null;
    }

    return props.render(props.mappedState, props.mappedActions);
};

export function makeComponentCreator<State, Actions>(makeOptions: {
    prepareState: (state: any) => State;
    prepareActions: (dispatch: Dispatch<AnyAction>) => Actions;
}) {
    return function createComponent<
        MappedState,
        MappedActions,
        OwnProps
    >(options: {
        mapState?: (state: State, ownProps: OwnProps) => MappedState;
        mapActions?: (actions: Actions, ownProps: OwnProps) => MappedActions;
    }) {
        const RenderPropComponent = connectAdvanced(
            (dispatch, factoryOptions) => {
                let mappedStateCache: any = null;
                let mappedActionsCache: any = null;
                let ownPropsCache: any = null;
                let preparedActions: any = null;

                let prevState: Object = {};
                let prevRender: any = null;

                let finalPropsCache: any = {};

                return (state, {render, ...ownProps}: any) => {
                    const stateChanged = state !== prevState;
                    prevState = state;

                    const ownPropsChanged = !shallowEqual(
                        ownPropsCache,
                        ownProps,
                    );
                    ownPropsCache = ownProps;

                    const renderChanged = prevRender !== render;
                    prevRender = render;

                    const someArgumentChanged = stateChanged || ownPropsChanged;

                    let resultChanged = false;

                    if (options.mapState && someArgumentChanged) {
                        let newMappedState = {};

                        try {
                            newMappedState = options.mapState(
                                makeOptions.prepareState(state),
                                ownProps,
                            );
                        } catch (error) {
                            if (isRenderNull(error)) {
                                newMappedState = {__renderNull: true};
                            } else {
                                throw error;
                            }
                        }

                        if (!shallowEqual(newMappedState, mappedStateCache)) {
                            mappedStateCache = newMappedState;
                            resultChanged = true;
                        }
                    }

                    if (options.mapActions && ownPropsChanged) {
                        if (!preparedActions) {
                            preparedActions = makeOptions.prepareActions(
                                dispatch,
                            );
                        }

                        const newMappedActions = options.mapActions(
                            preparedActions,
                            ownProps,
                        );
                        if (
                            !shallowEqual(newMappedActions, mappedActionsCache)
                        ) {
                            mappedActionsCache = newMappedActions;
                            resultChanged = true;
                        }
                    }

                    if (resultChanged || renderChanged) {
                        finalPropsCache = {
                            mappedState: mappedStateCache,
                            mappedActions: mappedActionsCache,
                            render: render,
                        };
                    }

                    return finalPropsCache;
                };
            },
        )(reduxRenderPropRender as any);

        // But return the component with proper types
        return (RenderPropComponent as any) as StatelessComponent<
            OwnProps & {
                render: (
                    data: MappedState,
                    actions: MappedActions,
                ) => ReactNode;
            }
        >;
    };
}
