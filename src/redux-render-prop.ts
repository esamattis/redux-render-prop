import {connectAdvanced} from "react-redux";
import shallowEqual from "./shallow-equal";

interface InternalProps {
    mappedState: any;
    mappedActions: any;
    render: Function;
}

const renderSelf = (props: InternalProps) =>
    props.render(props.mappedState, props.mappedActions);

export function makeCreator<State, Actions>(makeOptions: {
    prepareState: (state: any) => State;
    prepareActions: (dispatch: Function) => Actions;
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
                        const newMappedState = options.mapState(
                            makeOptions.prepareState(state),
                            ownProps,
                        );
                        if (!shallowEqual(newMappedState, mappedStateCache)) {
                            mappedStateCache = newMappedState;
                            resultChanged = true;
                        }
                    }

                    if (options.mapActions && ownPropsChanged) {
                        const newMappedActions = options.mapActions(
                            makeOptions.prepareActions(dispatch),
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
        )(renderSelf as any);

        // But return the component with proper types
        return (RenderPropComponent as any) as React.StatelessComponent<
            OwnProps & {
                render: (
                    data: MappedState,
                    actions: MappedActions,
                ) => React.ReactNode;
            }
        >;
    };
}
