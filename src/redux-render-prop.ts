import {connect} from "react-redux";
import shallowEqual from "./shallow-equal";

// Yep. We do a lot with any here.
const anyConnect = connect as any;

interface InternalProps {
    mappedState: any;
    mappedActions: any;
    render: Function;
}

const renderSelf = (props: InternalProps) =>
    props.render(props.mappedState, props.mappedActions);

function areStatePropsEqual(propsA: InternalProps, propsB: InternalProps) {
    return shallowEqual(propsA.mappedState, propsB.mappedState);
}

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
        const RenderPropComponent = anyConnect(
            (state: any, ownProps: OwnProps): Partial<InternalProps> => {
                if (options.mapState) {
                    return {
                        mappedState: options.mapState(
                            makeOptions.prepareState(state),
                            ownProps,
                        ),
                    };
                }
                return {};
            },
            (dispatch: any, props: OwnProps): Partial<InternalProps> => {
                if (options.mapActions) {
                    return {
                        mappedActions: options.mapActions(
                            makeOptions.prepareActions(dispatch),
                            props,
                        ),
                    };
                } else {
                    return {};
                }
            },
            null,
            {areStatePropsEqual},
        )(renderSelf);

        // But return the component with proper types
        return RenderPropComponent as React.StatelessComponent<
            OwnProps & {
                render: (
                    data: MappedState,
                    actions: MappedActions,
                ) => React.ReactNode;
            }
        >;
    };
}
