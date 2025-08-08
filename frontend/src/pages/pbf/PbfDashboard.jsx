import React from 'react';

function PbfDashboard() {
    const username = localStorage.getItem('username');

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Dashboard PBF</h1>
            <p className="mt-2">Selamat datang, {username}!</p>
            {/* Di sini Anda akan membangun UI untuk PBF */}
        </div>
    );
}

export default PbfDashboard;