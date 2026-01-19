import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="error-boundary-fallback" style={{ padding: '20px', border: '1px solid red', borderRadius: '8px', background: 'rgba(255,0,0,0.1)' }}>
                    <h3>Something went wrong rendering this content.</h3>
                    <p style={{ color: 'red' }}>{this.state.error && this.state.error.toString()}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
