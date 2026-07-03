'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Lock, TrendingUp, TrendingDown, Eye, Heart, Download, Share2, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard() {
  const { currentUser, pins } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userPinsCount = pins.filter(p => p.authorId === currentUser?.id).length;
  const isLocked = userPinsCount <= 20;

  useEffect(() => {
    if (!currentUser || isLocked) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics/creator');
        const json = await res.json();
        
        // Ensure timeline backfilling: explicitly plot 0 for days with no events
        const timeline = json.timeline || [];
        const backfilledTimeline = timeline.map((day: any) => ({
          date: day.date,
          views: day.views || 0,
          likes: day.likes || 0,
          downloads: day.downloads || 0,
          shares: day.shares || 0,
          total: (day.views || 0) + (day.likes || 0) + (day.downloads || 0) + (day.shares || 0)
        }));

        setData({ ...json, timeline: backfilledTimeline.reverse() });
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, isLocked]);

  if (!currentUser) return null;

  if (isLocked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-10 mb-8 flex flex-col items-center justify-center text-center animate-slideUp">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Creator Insights Locked</h3>
        <p className="text-foreground/60 max-w-md mx-auto">
          Upload <span className="text-accent font-semibold">{21 - userPinsCount}</span> more pins to unlock your personalized Creator Analytics dashboard and track your reach.
        </p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-10 mb-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const renderTrend = (value: number) => {
    if (value > 0) return <span className="text-green-400 flex items-center text-xs font-semibold mt-1">↗ {value}%</span>;
    if (value < 0) return <span className="text-red-400 flex items-center text-xs font-semibold mt-1">↘ {Math.abs(value)}%</span>;
    return <span className="text-foreground/40 text-xs font-semibold mt-1">— 0%</span>;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 mb-8 animate-slideUp">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent" />
            Creator Insights
          </h2>
          <p className="text-sm text-foreground/50 mt-1">Your performance over the last 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card/30 rounded-xl p-5 border border-border/30">
          <div className="flex items-center gap-2 text-foreground/60 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Total Views</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{data.views.toLocaleString()}</div>
          {renderTrend(data.trends.views)}
        </div>
        <div className="bg-card/30 rounded-xl p-5 border border-border/30">
          <div className="flex items-center gap-2 text-foreground/60 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Total Likes</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{data.likes.toLocaleString()}</div>
          {renderTrend(data.trends.likes)}
        </div>
        <div className="bg-card/30 rounded-xl p-5 border border-border/30">
          <div className="flex items-center gap-2 text-foreground/60 mb-2">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Downloads</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{data.downloads.toLocaleString()}</div>
          {renderTrend(data.trends.downloads)}
        </div>
        <div className="bg-card/30 rounded-xl p-5 border border-border/30">
          <div className="flex items-center gap-2 text-foreground/60 mb-2">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Shares</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{data.shares.toLocaleString()}</div>
          {renderTrend(data.trends.shares)}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <h3 className="text-sm font-medium text-foreground/60 mb-4">Engagement Volume (30 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.timeline} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D9BF0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1D9BF0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} minTickGap={30} />
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="total" name="Interactions" stroke="#1D9BF0" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
