import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Send, Calendar, Target, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CampaignCard({ campaign, onEdit, onDelete, onActivate }) {
  const statusColors = {
    draft: "bg-slate-100 text-slate-700",
    scheduled: "bg-blue-100 text-blue-700",
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-purple-100 text-purple-700",
    cancelled: "bg-rose-100 text-rose-700",
  };

  const channelIcons = {
    whatsapp: MessageSquare,
    sms: Send,
    email: Mail,
    all: Target,
  };

  const ChannelIcon = channelIcons[campaign.channel] || MessageSquare;

  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-slate-900">{campaign.name}</h3>
              <Badge className={statusColors[campaign.status]}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{campaign.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(campaign)}>Edit</DropdownMenuItem>
              {campaign.status === "draft" && (
                <DropdownMenuItem onClick={() => onActivate(campaign)}>Activate</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(campaign.id)} className="text-rose-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-[#1e3a5f]">{campaign.target_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Targeted</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{campaign.sent_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Sent</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{campaign.response_count || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Responses</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <ChannelIcon className="w-4 h-4" />
              <span className="capitalize">{campaign.channel}</span>
            </div>
            {campaign.discount_percent > 0 && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                {campaign.discount_percent}% OFF
              </Badge>
            )}
          </div>
          {campaign.start_date && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {format(new Date(campaign.start_date), "MMM dd")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}