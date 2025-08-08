import React from 'react';

function ApotekDashboard() {
    const username = localStorage.getItem('username');

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Dashboard Apotek</h1>
            <p className="mt-2">Selamat datang, {username}!</p>
            {/* Di sini Anda akan membangun UI untuk apotek */}
        </div>
    );
}

export default ApotekDashboard;
