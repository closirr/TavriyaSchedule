import { Calendar, Users, UserCheck, DoorOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function StatisticsDashboard() {
  const { data: statistics, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="bg-gray-200 h-4 w-20 mb-1 rounded"></div>
                  <div className="bg-gray-300 h-8 w-12 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Всього занять",
      value: statistics?.totalLessons || 0,
      icon: Calendar,
      bgColor: "bg-navy-100",
      iconColor: "text-navy-600"
    },
    {
      title: "Активних груп",
      value: statistics?.activeGroups || 0,
      icon: Users,
      bgColor: "bg-navy-100",
      iconColor: "text-navy-600"
    },
    {
      title: "Викладачів",
      value: statistics?.teachers || 0,
      icon: UserCheck,
      bgColor: "bg-navy-100",
      iconColor: "text-navy-600"
    },
    {
      title: "Аудиторій",
      value: statistics?.classrooms || 0,
      icon: DoorOpen,
      bgColor: "bg-navy-100",
      iconColor: "text-navy-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-semibold text-navy-700">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.iconColor} text-xl w-6 h-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
