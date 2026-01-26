import 'dotenv/config';
import axios from 'axios';

async function main() {
  const baseUrl = process.env.RAYNET_INSTANCE_URL;
  const instanceName = process.env.RAYNET_INSTANCE_NAME;
  const username = process.env.RAYNET_USERNAME;
  const apiKey = process.env.RAYNET_API_KEY;
  
  const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'X-Instance-Name': instanceName,
    'Content-Type': 'application/json',
  };
  
  const projectId = 6;
  
  // Try various endpoint patterns for participants/team members
  const patterns = [
    `/project/${projectId}/participant/`,
    `/project/${projectId}/team/`,
    `/project/${projectId}/member/`,
    `/project/${projectId}/person/`,
    `/project/${projectId}/relationship/`,
    `/project/${projectId}/relationship/person/`,
    `/projectParticipant/`,
    `/projectMember/`,
  ];
  
  for (const pattern of patterns) {
    console.log(`\nTrying GET ${pattern}`);
    try {
      const resp = await axios.get(`${baseUrl}${pattern}`, { headers });
      console.log('SUCCESS:', JSON.stringify(resp.data, null, 2));
    } catch (e: any) {
      console.log('Error:', e.response?.status, e.response?.data?.message || 'no message');
    }
  }
}

main().catch(console.error);
