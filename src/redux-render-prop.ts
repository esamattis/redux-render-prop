import {connectAdvanced} from "react-redux";
import shallowEqual from "./shallow-equal";
import {Dispatch, AnyAction} from "redux";
import {StatelessComponent, ReactNode} from "react";

interface InternalProps {
    mappedState: any;
    mappedActions: any;
    render: Function;
}

export type MappedState<T extends {__data: any}> = T extends {__data: infer V}
    ? V
    : never;

export type MappedActions<T extends {__actions: any}> = T extends {
    __actions: infer V;
}
    ? V
    : never;

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
    if (props.mappedState && props.mappedState.__renderNull) {
        return null;
    }

    if (typeof props.render !== "function") {
        return null;
    }

    return props.render(props.mappedState, props.mappedActions);
};

export function makeConnector<State, Actions>(makeOptions: {
    prepareState: (state: any) => State;
    prepareActions: (dispatch: Dispatch<AnyAction>) => Actions;
}) {
    return function createComponent<
        MappedState,
        MappedActions,
        OwnProps
    >(options: {
        mapState?: (state: State, ownProps: OwnProps) => MappedState;
        memoizeMapState?: (
            state: State,
            ownProps: OwnProps,
        ) => (state: State, ownProps: OwnProps) => MappedState;
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

                let memoizedMapState:
                    | null
                    | ((
                          state: State,
                          ownProps: OwnProps,
                      ) => MappedState) = null;

                return (state, {children, render, ...ownProps}: any) => {
                    const passRender = children || render;
                    const stateChanged = state !== prevState;

                    prevState = state;

                    const ownPropsChanged = !shallowEqual(
                        ownPropsCache,
                        ownProps,
                    );

                    if (ownPropsChanged) {
                        ownPropsCache = ownProps;
                    }

                    const renderChanged = prevRender !== passRender;
                    prevRender = passRender;

                    let mappedStateChanged = false;
                    let mappedActionsChanged = false;

                    const preparedState = makeOptions.prepareState(state);

                    if (!memoizedMapState && options.memoizeMapState) {
                        memoizedMapState = options.memoizeMapState(
                            preparedState,
                            ownPropsCache,
                        );
                    }

                    const mapState = memoizedMapState || options.mapState;

                    if (mapState && (stateChanged || ownPropsChanged)) {
                        let newMappedState = {};

                        try {
                            newMappedState = mapState(
                                preparedState,
                                ownPropsCache,
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
                            mappedStateChanged = true;
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
                            ownPropsCache,
                        );
                        if (
                            !shallowEqual(newMappedActions, mappedActionsCache)
                        ) {
                            mappedActionsCache = newMappedActions;
                            mappedActionsChanged = true;
                        }
                    }

                    if (
                        mappedStateChanged ||
                        mappedActionsChanged ||
                        renderChanged
                    ) {
                        finalPropsCache = {
                            mappedState: mappedStateCache,
                            mappedActions: mappedActionsCache,
                            render: passRender,
                        };
                    }

                    return finalPropsCache;
                };
            },
        )(reduxRenderPropRender as any);

        // But return the component with proper types
        return (RenderPropComponent as any) as StatelessComponent<
            OwnProps & {
                children?: (
                    data: MappedState,
                    actions: MappedActions,
                ) => ReactNode;
                render?: (
                    data: MappedState,
                    actions: MappedActions,
                ) => ReactNode;
            }
        > & {
            __data: MappedState;
            __actions: MappedActions;
        };
    };
}

// Old removed api with nice error message
export function makeComponentCreator(
    a: "makeComponentCreator is renamed to makeConnector",
): "makeComponentCreator is renamed to makeConnector" {
    throw new Error("makeComponentCreator is renamed to makeConnector");
}
